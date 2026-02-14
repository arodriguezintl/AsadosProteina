import { supabase } from '@/lib/supabase'
import type { Employee, WorkShift, Payroll } from '@/types/hr'

export const HRService = {
    // --- Employees ---
    async getEmployees(storeId: string) {
        const { data, error } = await supabase
            .schema('public')
            .from('employees')
            .select(`
                *,
                user:user_profiles(*)
            `)
            .eq('store_id', storeId)
            .order('first_name')

        if (error) throw error
        return data as Employee[]
    },

    async createEmployee(employee: Partial<Employee>) {
        const { data, error } = await supabase
            .schema('public')
            .from('employees')
            .insert(employee)
            .select()
            .single()

        if (error) throw error
        return data as Employee
    },

    async updateEmployee(id: string, updates: Partial<Employee>) {
        const { data, error } = await supabase
            .schema('public')
            .from('employees')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return data as Employee
    },

    // --- Time Tracking ---
    async clockIn(employeeId: string, storeId: string, notes?: string) {
        // Check if already clocked in
        const { data: existing } = await supabase
            .from('work_shifts')
            .select('*')
            .eq('employee_id', employeeId)
            .is('check_out', null)
            .single()

        if (existing) throw new Error('Ya tienes un turno activo.')

        const { data, error } = await supabase
            .from('work_shifts')
            .insert({
                employee_id: employeeId,
                store_id: storeId,
                check_in: new Date().toISOString(),
                notes: notes,
                status: 'active'
            })
            .select()
            .single()

        if (error) throw error
        return data as WorkShift
    },

    async clockOut(employeeId: string, notes?: string) {
        // Get active shift
        const { data: shift } = await supabase
            .from('work_shifts')
            .select('*')
            .eq('employee_id', employeeId)
            .is('check_out', null)
            .single()

        if (!shift) throw new Error('No tienes un turno activo.')

        const checkOutTime = new Date()
        const checkInTime = new Date(shift.check_in)
        const durationHours = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60)

        const { data, error } = await supabase
            .from('work_shifts')
            .update({
                check_out: checkOutTime.toISOString(),
                total_hours: durationHours,
                status: 'completed',
                notes: notes ? `${shift.notes ? shift.notes + '\n' : ''}${notes}` : shift.notes
            })
            .eq('id', shift.id)
            .select()
            .single()

        if (error) throw error
        return data as WorkShift
    },

    async getActiveShift(employeeId: string) {
        const { data, error } = await supabase
            .from('work_shifts')
            .select('*')
            .eq('employee_id', employeeId)
            .is('check_out', null)
            .single()

        if (error && error.code !== 'PGRST116') throw error // Ignore 'No rows found'
        return data as WorkShift | null
    },

    async getShifts(employeeId: string, startDate?: string, endDate?: string) {
        let query = supabase
            .from('work_shifts')
            .select('*')
            .eq('employee_id', employeeId)
            .order('check_in', { ascending: false })

        if (startDate) query = query.gte('check_in', startDate)
        if (endDate) query = query.lte('check_in', endDate)

        const { data, error } = await query
        if (error) throw error
        return data as WorkShift[]
    },

    // --- Payroll ---
    async generatePayroll(employeeId: string, startDate: string, endDate: string) {
        // 1. Get Employee
        const { data: employee } = await supabase
            .from('employees')
            .select('*')
            .eq('id', employeeId)
            .single()

        if (!employee) throw new Error('Employee not found')

        // 2. Calculate Hours/pay
        // Simple logic for now
        let totalAmount = 0
        let totalHours = 0

        if (employee.salary_type === 'hourly') {
            const { data: shifts } = await supabase
                .from('work_shifts')
                .select('total_hours')
                .eq('employee_id', employeeId)
                .gte('check_in', startDate)
                .lte('check_in', endDate)
                .not('total_hours', 'is', null)

            totalHours = shifts?.reduce((sum, s) => sum + (s.total_hours || 0), 0) || 0
            totalAmount = totalHours * (employee.salary_amount || 0)
        } else if (employee.salary_type === 'monthly') {
            // Prorate? Or fixed? Assuming semi-monthly 15 days?
            // For simplicity, just use base amount / 2 for bi-weekly?
            // User requested "control horario", implies hourly is important.
            // Let's assume input base_salary is Monthly, so divided by 2 if bi-weekly.
            totalAmount = (employee.salary_amount || 0) / 2
        }

        // 3. Create Draft Payroll
        const { data: payroll, error } = await supabase
            .from('payrolls')
            .insert({
                employee_id: employeeId,
                store_id: employee.store_id,
                period_start: startDate,
                period_end: endDate,
                base_salary: employee.salary_amount,
                total_hours: totalHours,
                total_paid: totalAmount,
                status: 'draft'
            })
            .select()
            .single()

        if (error) throw error
        return payroll as Payroll
    },

    async getPayrolls(storeId: string) {
        const { data, error } = await supabase
            .from('payrolls')
            .select(`
                *,
                employee:employees(first_name, last_name, position)
            `)
            .eq('store_id', storeId)
            .order('created_at', { ascending: false })

        if (error) throw error
        return data as (Payroll & { employee: Employee })[]
    }
}
