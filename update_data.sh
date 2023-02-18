#! /bin/bash
set -x

CITIES=("Nairobi" "New York" "Princeton" "Stockholm" "Toronto" "Vienna")

for city in "${CITIES[@]}"
do
  csv=$(echo $city | tr '[:upper:]' '[:lower:]' | tr ' ' '_')
  psql $openweather_uri -c "\copy (select * from weather_metrics where city_name = '$city') TO data/$csv.csv DELIMITER ',' CSV"
done
