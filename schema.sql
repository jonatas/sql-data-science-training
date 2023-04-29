CREATE EXTENSION timescaledb;
CREATE EXTENSION timescaledb_toolkit;
CREATE TABLE public.weather_metrics (
    "time" timestamptz NOT NULL,
    timezone_shift integer,
    city_name text,
    temp_c double precision,
    feels_like_c double precision,
    temp_min_c double precision,
    temp_max_c double precision,
    pressure_hpa double precision,
    humidity_percent double precision,
    wind_speed_ms double precision,
    wind_deg integer,
    rain_1h_mm double precision,
    rain_3h_mm double precision,
    snow_1h_mm double precision,
    snow_3h_mm double precision,
    clouds_percent integer,
    weather_type_id integer
);

CREATE INDEX weather_metrics_city_name_idx ON weather_metrics USING btree (city_name, "time");
CREATE INDEX weather_metrics_time_idx ON weather_metrics USING btree ("time" DESC);

SELECT create_hypertable('weather_metrics', 'time', chunk_time_interval => INTERVAL '1 month');

ALTER TABLE weather_metrics SET (timescaledb.compress,
  timescaledb.compress_segmentby='city_name',
  timescaledb.compress_orderby='time');
