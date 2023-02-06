# PGConf India 2023

### Timescaledb
#### &
### Toolkit

#### **Jônatas Davi Paganini**
#### @jonatasdp

# @jonatasdp

    * Postgresql since 2004.

* Backend developer
* Ruby/Shell/Postgresql/Vim

    * Developer Advocate at Timescale

#### twitter: @jonatasdp
#### github: @jonatas

# Agenda

1. Introduction to Data Science - 1h
2. Exploring the Time Series dataset - 1h
3. Practical exercises with the dataset - 1h
4. Knowledge sharing - 0.5h

> we can have short stops every hour.

# Introduction

1. Data Science and its Applications in various domains
   - Focus of Today will be a weather analysis.

2. Introduction to SQL and Postgresql
   - Overview of SQL, its syntax and use cases.
   - Introduction to Postgresql database and its features.

3. Overview of Timescaledb and its Features
   - Explanation of what Timescaledb is and how it extends Postgresql for time-series data.
   - Overview of the features and benefits of using Timescaledb for time-series data analysis.

# Data Science

> Data science is an interdisciplinary field
> that involves using statistical and computational methods
> to extract insights and knowledge from data.

## Applications

In the context of weather analysis, data science can be used to

1. analyze weather metrics
2. predict future weather patterns

> We're not going to focus on prediction Today.

# Data

Source is from open weather:

https://openweathermap.org

* Free data from entire world.
* Free API.
* Statistics from anywhere.
* Time-series data.

> The focus will be **weather metrics**.

## Interface

Interact with open weather dataset via psql:

```bash
psql open_weather
```

> you can use your favorite tool if you want ;)

## Create

Use `createdb open_weather` in case you don't have it yet.

> you can use your favorite tool if you want ;)

## Download

Download the repository:

https://github.com/jonatas/sql-data-science-training

## Table

```sql
CREATE TABLE public.weather_metrics (
    "time" timestamp without time zone NOT NULL,
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
```

## Hypertable

```sql
SELECT create_hypertable('weather_metrics', 'time',
  chunk_time_interval => INTERVAL '1 month');
```

## Import

We'll use the CSVs in the `data` folder from

**https://github.com/jonatas/sql-data-science-training**.

```sql
\i schema.sql
\COPY weather_metrics FROM './data/nairobi.csv' DELIMITER ',' CSV HEADER;
\COPY weather_metrics FROM './data/ny.csv' DELIMITER ',' CSV HEADER;
\COPY weather_metrics FROM './data/toronto.csv' DELIMITER ',' CSV HEADER;
\COPY weather_metrics FROM './data/stockholm.csv' DELIMITER ',' CSV HEADER;
\COPY weather_metrics FROM './data/princeton.csv' DELIMITER ',' CSV HEADER;
\COPY weather_metrics FROM './data/vienna.csv' DELIMITER ',' CSV HEADER;
```

## Timing

On psql we can enable timing to check the performance of every command:

```
\timing
```

## Counting

```sql
 SELECT count(1) FROM weather_metrics; # => 4092484
Time: 227.889 ms
```

## Approx. row count

Timescaledb offers a different counting approach that is very approximate to
real counter.

```sql
SELECT approximate_row_count('weather_metrics') ; # => 4092484
Time: 14.310 ms
```

Note that `220 / 14` = **16 times faster**.


## Check

Describe the weather_metrics table:

```sql
\d weather_metrics
```

# 5WH

The **Hypertable** 5WH!

* **Who**: The timescaledb extension
* **What**: Hypertable
* **When**: you need to handle time-series data (insert, select, update, delete)
* **Where**: In your PostgreSQL database
* **Why**: to optimize time-series throughtput
* **How**: using table partitions to compress, parallelize and manage smaller chunks of data.

```sql
\d+ weather_metrics
```

## Explore

Explring the Time Series Data and starting answering a few questions.

## Questions

> Answer with sql

* How many different cities are available?
* When the data starts and when it ends?
* How many records we have per city?
* What was the average temperature of New York in January.

## Distinct

> What are the cities are available?

```sql
SELECT DISTINCT city_name FROM weather_metrics;
```

## Count

> How many different cities are available?

```sql
SELECT COUNT(DISTINCT city_name) FROM weather_metrics;
```

## Min / Max

> When the data starts and when it ends?

```sql
select min(time), max(time) from weather_metrics
```

## Group

> How many records we have per city?

```sql
select city_name, count(*) from weather_metrics group by 1;
```

## Avg

> What was the average temperature over all times?

```sql
select city_name, avg(temp_c) from weather_metrics  group by 1;
```

## Time Series

**Time Series Analysis in SQL and Timescaledb**

> What was the average temperature of NY in the previous month?

```sql
select avg(temp_c) from weather_metrics
where city_name = 'New York'
and time between '2023-01-01' and '2023-01-31';
```

## Partitions

Hypertable will partition date by time interval.

Let's run EXPLAIN ANALYZE in the previous query:

```sql
EXPLAIN ANALYZE
select avg(temp_c) from weather_metrics
where city_name = 'New York'
and time between '2023-01-01' and '2023-01-31';
```

## Explain

Understanding a bit of the execution plan:

```sql
EXPLAIN SELECT count(1) FROM weather_metrics;
```

Partitioned tables can divide and conquer!

```
->  Parallel Append  (cost=0.29..56957.24 rows=1023114 width=0)                                                                                    │
│  ->  Parallel Index Only Scan using _hyper_1_...idx on _hyper_1_...
```

## time bucket

Get average of temperature grouped by one hour.

```sql
SELECT time_bucket('1 hour', time) AS bucket,
  avg(temp_c)
FROM weather_metrics
 WHERE city_name = 'New York'
AND time BETWEEN '2022-06-01' AND '2022-06-02'
GROUP BY 1 ORDER BY 1;
```

The `time_bucket` also supports timestamps with time zones.

## Min / Max

Now, let's get a bit more details adding the min AND max:

```sql
SELECT time_bucket('1 hour'::interval, time) AS bucket,
  avg(temp_c)::numeric(4,2),
  min(temp_c), max(temp_c)
FROM weather_metrics
WHERE city_name = 'New York'
  AND time BETWEEN '2022-06-01' AND '2022-06-02'
GROUP BY 1 ORDER BY 1;
```

## OHLC

    OHLC = Candlestick pattern: capturing Open, High, Low, Close values grouped
    by a timeframe.

```sql
SELECT time_bucket('1 hour'::interval, time) AS bucket,
  first(temp_c, time) as open,
  max(temp_c) as high,
  min(temp_c) as low,
  last(temp_c, time) as close
FROM weather_metrics
WHERE city_name = 'New York'
  AND time BETWEEN '2022-06-01' AND '2022-06-02'
GROUP BY 1 ORDER BY 1;
```

You can also use `first` and `last` to find the open/close inside a time_bucket.

> Later we'll see the `candlestick_agg` from the toolkit extension.

## Stddev

Now, we can also check the standard deviation:

```sql
SELECT time_bucket('1 hour'::interval, time) AS bucket,
  avg(temp_c)::numeric(4,2),
  min(temp_c), max(temp_c), stddev(temp_c)
FROM weather_metrics
WHERE city_name = 'New York'
  AND time BETWEEN '2022-06-01' AND '2022-06-02'
GROUP BY 1 ORDER BY 1;
```

## array_agg

Now going deep into individual values inside this hour:

```sql
 SELECT time_bucket('1 hour'::interval, time) AS bucket,
array_agg( temp_c)
FROM weather_metrics
 WHERE city_name = 'New York'
AND time BETWEEN '2022-06-01 00:00:00' AND '2022-06-01 01:00:00'
GROUP BY 1 ORDER BY 1;
```

# Toolkit

Enable the toolkit extension:

```sql
CREATE EXTENSION timescaledb_toolkit;
```

* Statistic functions

# percentile_agg

To get the percentile_agg function an overview:

```sql
SELECT time_bucket('1 hour'::interval, time) AS bucket,
   percentile_agg( temp_c)
FROM weather_metrics
 WHERE city_name = 'New York'
AND time BETWEEN '2022-06-01 00:00:00' AND '2022-07-01 01:00:00'
GROUP BY 1 ORDER BY 1;
```

The functions with `_agg` suffix' indicates that several statistical aggregates
can be pre-computed and save computing later.

They also support the **pipeline operator**.

# Median from percentile

Extracting the median from the percentile:

```sql
SELECT time_bucket('1 month'::interval, time) AS bucket,
    approx_percentile(0.5, percentile_agg( temp_c)) as median
  FROM weather_metrics
  WHERE city_name = 'New York'
    AND time BETWEEN '2021-06-01 00:00:00' AND '2022-07-01 01:00:00'
  GROUP BY 1 ORDER BY 1;
```

# Pipeline

Allows functional programming in SQL with the pipeline operator `->`.

```sql
SELECT time_bucket('1 month'::interval, time) AS bucket,
    percentile_agg( temp_c) -> approx_percentile(0.5) as median
  FROM weather_metrics
  WHERE city_name = 'New York'
    AND time BETWEEN '2021-06-01 00:00:00' AND '2022-07-01 01:00:00'
  GROUP BY 1 ORDER BY 1;
```

# quartiles

Now, getting quartiles AND median from percentiles:

```sql
SELECT time_bucket('1 month'::interval, time) AS bucket,
    approx_percentile(0.25, percentile_agg( temp_c)) AS q_1,
    approx_percentile(0.5, percentile_agg( temp_c)) AS median,
    approx_percentile(0.75, percentile_agg( temp_c)) AS q3
FROM weather_metrics
 WHERE city_name = 'New York'
AND time BETWEEN '2021-06-01 00:00:00' AND '2022-06-01 01:00:00'
GROUP BY 1 ORDER BY 1;
```

# CTE

Pre-compute aggregations with CTE can reuse the previous calculated `percentile_agg`:

```sql
WITH one_month AS (
  SELECT time_bucket('1 month'::interval, time) AS bucket,
    percentile_agg( temp_c)
  FROM weather_metrics
  WHERE city_name = 'New York'
    AND time BETWEEN '2021-06-01 00:00:00' AND '2022-07-01 01:00:00'
  GROUP BY 1 ORDER BY 1
)
SELECT bucket,
  approx_percentile(0.25, percentile_agg) AS q_1,
  approx_percentile(0.5, percentile_agg) AS median,
  approx_percentile(0.75, percentile_agg) AS q3
FROM one_month;
```

# Stats aggs

Statistical aggregates in one or two dimensions to pre-compute statistics summary.

```sql
SELECT time_bucket('1 hour'::interval, time) AS bucket,
   stats_agg( temp_c) AS hourly_agg
FROM weather_metrics
 WHERE city_name = 'New York'
AND time BETWEEN '2022-06-01 00:00:00' AND '2022-07-01 01:00:00'
GROUP BY 1 ORDER BY 1
```

# Average

Compute an average from stats aggs is very easy:

```sql
 SELECT time_bucket('1 hour'::interval, time) AS bucket,
   average(stats_agg( temp_c)) AS hourly_average
FROM weather_metrics
 WHERE city_name = 'New York'
AND time BETWEEN '2022-06-01 00:00:00' AND '2022-07-01 01:00:00'
GROUP BY 1 ORDER BY 1
```

# Alias

Using CTE to reuse the stats aggs pre-computed data:

```sql
WITH agg AS (
  SELECT time_bucket('1 hour'::interval, time) AS bucket,
    stats_agg( temp_c)
  FROM weather_metrics
  WHERE city_name = 'New York'
  AND time BETWEEN '2022-06-01 00:00:00' AND '2022-07-01 01:00:00'
  GROUP BY 1
  ORDER BY 1
)
SELECT bucket, average(stats_agg) FROM agg;
```

# Rollup

Rollup can combine stats aggs in different time frames:

```sql
WITH hourly AS (
  SELECT time_bucket('1 hour'::interval, time) AS hour_bucket,
    stats_agg( temp_c)
  FROM weather_metrics
  WHERE city_name = 'New York'
  AND time between '2022-06-01 00:00:00' AND '2022-07-01 01:00:00'
  GROUP BY 1 ORDER BY 1
)
SELECT time_bucket('1 day', hour_bucket),
  average(rollup(stats_agg))
FROM hourly GROUP BY 1;
```

# cascade

Cascading rollups can reuse previous stats aggs:

```sql
WITH hourly AS ( SELECT time_bucket('1 hour'::interval, time) AS bucket,
    stats_agg( temp_c) AS hourly_agg
  FROM weather_metrics
  WHERE city_name = 'New York'
    AND time BETWEEN '2021-06-01 00:00:00' AND '2022-07-01 01:00:00'
  GROUP BY 1 ORDER BY 1
),
daily AS ( SELECT time_bucket('1 day', bucket) AS bucket,
    rollup(hourly_agg) AS daily_agg
  FROM hourly GROUP BY 1
),
monthly AS ( SELECT time_bucket('1 month', bucket) AS bucket,
   rollup(daily_agg) AS monthly_agg
 FROM daily GROUP BY 1
)
SELECT bucket, average(monthly_agg) from monthly;
```

# Variance

Adding `variance` AND `stddev` without expensive computing process:

```sql
-- previous stats aggs example
SELECT bucket,
  average(monthly_agg),
  variance(monthly_agg),
  stddev(monthly_agg)
FROM monthly;
```

# num_vals

Querying number of values from pre-computed stats aggs:

```SQL
WITH hourly AS (
  SELECT time_bucket('1 hour'::interval, time) AS bucket,
    stats_agg( temp_c) AS hourly_agg
  FROM weather_metrics
  WHERE city_name = 'New York'
  AND time BETWEEN '2021-06-01 00:00:00' AND '2022-06-01 01:00:00'
  GROUP BY 1 ORDER BY 1
)
SELECT bucket, average(hourly_agg), num_vals(hourly_agg) from hourly;
```

# CAggs

> AKA Continuous Aggregates ;)

Materialized views for hypertables.

```sql
CREATE MATERIALIZED VIEW ny_hourly_agg
WITH (timescaledb.continuous) AS
SELECT time_bucket('1 hour'::interval, time) AS bucket,
   stats_agg( temp_c) AS hourly_agg
FROM weather_metrics
 WHERE city_name = 'New York'
GROUP BY 1;
```

Materialized data can be combined with real time data from open timeframes.

# caggs^2?

```sql
CREATE MATERIALIZED VIEW ny_daily_agg
WITH (timescaledb.continuous) AS
SELECT time_bucket('1 day',bucket),
rollup(hourly_agg) AS daily_agg
FROM ny_hourly_agg group by 1;
```

not allowed, but can save processing with regular views:

```sql
CREATE VIEW ny_daily_agg AS
SELECT time_bucket('1 day',bucket),
    rollup(hourly_agg) AS daily_agg
FROM ny_hourly_agg GROUP BY 1;
```

# Candlesticks

Ticks table:

```sql
CREATE TABLE ticks
( time TIMESTAMPTZ NOT NULL,
    symbol varchar,
    price double precision,
    volume int);

SELECT create_hypertable('ticks', 'time', chunk_time_interval => INTERVAL '1 day');
```

# Caggs

```sql
CREATE MATERIALIZED VIEW _ohlcv_1m
WITH (timescaledb.continuous) AS
    SELECT time_bucket('1 minute'::interval, time),
      symbol,
      toolkit_experimental.ohlc(time, price),
      sum(volume) as volume
    FROM ticks
    GROUP BY 1,2 WITH DATA;
```

# View

```sql
SELECT time_bucket,
  symbol,
  toolkit_experimental.open(ohlc),
  toolkit_experimental.open_time(ohlc),
  toolkit_experimental.high(ohlc),
  toolkit_experimental.high_time(ohlc),
  toolkit_experimental.low(ohlc),
  toolkit_experimental.low_time(ohlc),
  toolkit_experimental.close(ohlc),
  toolkit_experimental.close_time(ohlc),
  volume
FROM _ohlcv_1m;
```

# Correlation

```sql
WITH ny AS (
    SELECT
        time_bucket ('1 month', time),
        avg(temp_c)
    FROM
        weather_metrics
    WHERE
        city_name = 'New York'
        AND time BETWEEN '2010-01-01' AND '2021-01-01'
    GROUP BY 1
),
nai AS (
    SELECT
        time_bucket ('1 month', time),
        avg(temp_c)
    FROM
        weather_metrics
    WHERE
        city_name = 'Nairobi'
        AND time BETWEEN '2010-01-01' AND '2021-01-01'
    GROUP BY 1
)
SELECT
    time_bucket ('1 y', ny.time_bucket),
    covariance(stats_agg(ny.avg, nai.avg)),
    corr(stats_agg(ny.avg, nai.avg))
FROM ny
    JOIN nai ON ny.time_bucket = nai.time_bucket
GROUP BY 1;
```

# Correlation matrix

Enable tablefunc to use crosstab:

```sql
CREATE EXTENSION tablefunc;
```

# Combining pairs

```sql
WITH city_names AS (
  SELECT DISTINCT city_name as name
    FROM weather_metrics order by 1
)
SELECT a.name as first, b.name as second
  FROM city_names a
  JOIN city_names b ON true;
```

# Crosstab

```sql
SELECT * FROM crosstab($$
        WITH city_names AS (
                SELECT DISTINCT city_name as name
                FROM weather_metrics order by 1
        ),
pairs as (
  SELECT a.name as first, b.name as second
  FROM city_names a
  JOIN city_names b ON true
),
summary AS (
    SELECT time_bucket('1 h', time), city_name,
        avg(temp_c)
    FROM weather_metrics
    WHERE time BETWEEN '2010-01-01' AND '2021-01-01'
    GROUP BY 1,2
ORDER BY 1,2)
SELECT
    a.city_name as first, b.city_name as second,
    corr(stats_agg(a.avg, b.avg))
FROM pairs
JOIN summary a ON (pairs.first = a .city_name)
JOIN summary b ON (pairs.second = b.city_name AND a.time_bucket = b.time_bucket)
--WHERE b.city_name = 'New York' and a.city_name = 'Nairobi'
GROUP BY 1,2
 order by 1, 2
$$::text,
'select distinct city_name from weather_metrics order by 1'::text
) as ct(city_name text,
  "Austin" double precision, "Lisbon" double precision, "Nairobi" double precision, "New York" double precision, "Pietermaritzburg" double precision, "Princeton" double precision, "San Francisco" double precision, "Stockholm" double precision, "Toronto" double precision, "Vienna" double precision);
```

# Exercises

Practical exercises to perform Time Series analysis in SQL and Timescaledb.

# Practical exercises with the dataset

1. Hands-on exercises to perform Time Series analysis on the weather dataset.
2. Aggregating data with tookit.
3. Approximate Percentiles
4. Creating candlesticks (OHLC charts)
5. Correlation matrix: Creating a correlation matrix in Postgresql from the correlation coefficient
6. Downsampling: Using the LTTB function to reduce large datasets without losing visual similarity with the original data

## Knowledge sharing

- Presentations and knowledge sharing by the participants

> Opportunities for students to present their findings
> and share their knowledge with the rest of the class.


# Extra Resources

- https://github.com/timescale/timescaledb
- https://github.com/timescale/timescaledb-toolkit
- https://timescale.com/community
- https://docs.timescale.com/

# Thanks

- [@jonatasdp](https://twitter.com/jonatasdp) on {Twitter,Linkedin}
- Github: [@jonatas](https://github.com/jonatas)

#### Jônatas Davi Paganini
