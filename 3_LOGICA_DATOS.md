# Definición de Endpoints y JSON

## GET /api/v1/dashboard/summary
```json
{
  "kpis": {
    "daily_revenue": 1240.00,
    "active_orders": 14,
    "new_customers": 5,
    "average_ticket": 85.00
  },
  "weekly_stats": [
    {"day": "Lun", "value": 450},
    {"day": "Mar", "value": 600},
    {"day": "Mie", "value": 800}
  ],
  "top_products": [
    {"name": "Asado de Tira", "count": 45, "percentage": 85},
    {"name": "Pechuga Fit", "count": 30, "percentage": 60}
  ]
}