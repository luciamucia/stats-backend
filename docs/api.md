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
