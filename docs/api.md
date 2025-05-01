# Dokumentacja API do wyświetlania wykresów (frontend)

## Endpoints

### 1. Pobieranie listy typów wykresów

GET `/api/chart`

- Zwraca tablicę stringów z nazwami dostępnych typów wykresów.
- Przykład odpowiedzi:
  ```json
  ["przychody", "wydatki", "oszczednosci"]
  ```

### 2. Pobieranie danych do wykresu danego typu

GET `/api/chart/{type}`

- `{type}` to nazwa typu wykresu, np. `przychody`.
- Zwraca tablicę obiektów z danymi do wykresu liniowego.
- Przykład odpowiedzi:
  ```json
  [
    { "timestamp": "2024-01-01", "value": 1000 },
    { "timestamp": "2024-02-01", "value": 1200 }
  ]
  ```
- `timestamp` – data (najczęściej miesiąc, format: YYYY-MM-DD)
- `value` – wartość liczbową dla danego okresu

## Przykład użycia (JS)

```js
// Pobierz listę typów wykresów
const types = await fetch('/api/chart').then(r => r.json());

for (const type of types) {
  // Pobierz dane do wykresu danego typu
  const data = await fetch(`/api/chart/${type}`).then(r => r.json());
  // data: [{ timestamp, value }, ...]
  // ...tutaj renderowanie wykresu, np. Chart.js
}
```

## Uwagi
- Każdy typ wykresu to osobna seria czasowa.
- Dane są agregowane miesięcznie (timestamp = pierwszy dzień miesiąca).
- Wartości mogą być liczbami całkowitymi lub zmiennoprzecinkowymi.
- API jest zoptymalizowane pod wykresy liniowe, ale można je wykorzystać do innych typów wizualizacji.

## Dodatkowe endpointy
- `/api/tiles` – zwraca kafelki z danymi (do dashboardu)
- `/api/pie` – zwraca dane do wykresu kołowego

---

# Chart API documentation (EN)

## Endpoints

### 1. Get chart types
GET `/api/chart`
Returns an array of available chart types (strings).

### 2. Get chart data for a type
GET `/api/chart/{type}`
Returns an array of objects:
- `timestamp` (string, e.g. "2024-01-01")
- `value` (number)

## Example usage
```js
const types = await fetch('/api/chart').then(r => r.json());
for (const type of types) {
  const data = await fetch(`/api/chart/${type}`).then(r => r.json());
  // render chart with data
}
```

## Notes
- Each chart type is a separate time series.
- Data is monthly aggregated.
- API is optimized for line charts, but can be used for other visualizations.

---

# API Reference

## Tiles

- **GET /tiles**
  - Returns a list of tiles with statistical data.
  - Example response:
    ```json
    [
      { "id": 1, "label": "Users", "value": 123 },
      ...
    ]
    ```

## Pie

- **GET /pie**
  - Returns data for a pie chart.
  - Example response:
    ```json
    [
      { "label": "A", "value": 10 },
      { "label": "B", "value": 20 }
    ]
    ```

## Chart

- **GET /chart**
  - Returns data for a line/bar chart.
  - Example response:
    ```json
    {
      "labels": ["2024-01", "2024-02"],
      "values": [10, 20]
    }
    ```

## Notes

- All endpoints return data in JSON format.
- For implementation details and parameterization, see the source code in `src/routes/`.
