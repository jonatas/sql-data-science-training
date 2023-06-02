# Data Science Intro

```sql
SELECT
  'PGCon' as conference_name,
  2023 as edition,
  'Data Science with Postgres: Introductory Training' as workshop_title,
  'Jônatas Davi Paganini' as author,
  'jonatas@timescale.com' as author_mail
```

# Is Global Warming Real?

> Is Toronto getting warmer?

```sql
WITH summer AS (
    SELECT *
    FROM public.weather_metrics
    WHERE city_name = 'Toronto'
    AND EXTRACT(MONTH FROM time) IN (6, 7, 8) -- Summer months (June, July, August)
    AND EXTRACT(HOUR FROM (time + timezone_shift::text::interval)) BETWEEN 12 AND 16 -- Hot hours (12:00 PM to 4:00 PM)
)
SELECT time_bucket('1 year', time) AS x,
    AVG(temp_c) AS y
FROM summer
GROUP BY 1
ORDER BY 1
```

# Is Toronto getting colder?

```sql
WITH winter AS (
    SELECT *
    FROM public.weather_metrics
    WHERE city_name = 'Toronto'
    AND EXTRACT(MONTH FROM time) IN (12, 1, 2) -- Winter months (December, January, February)
    AND EXTRACT(HOUR FROM (time + timezone_shift::text::interval)) BETWEEN 0 AND 4 -- Cold hours (12:00 AM to 4:00 AM)
)
SELECT time_bucket('1 year', time) AS x,
    AVG(temp_c) AS y
FROM winter
GROUP BY 1
ORDER BY 1;
```

# Welcome

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

1. Introduction to Data Science
2. Exploring the Time Series dataset
3. Practical exercises with the dataset
4. Knowledge sharing

> we can have short breaks each hour

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
* Statistics from axwhere.
* Time-series data.

> The focus will be **weather metrics**.

## Interface

Interact with open weather dataset via psql:

```bash
psql openweather
```

> you can use your favorite tool if you want ;)

## Create

Use `createdb openweather` in case you don't have it yet.

> you can use your favorite tool if you want ;)

## Extension

If you don't have timescaledb installed on your database, enable the extension:

```sql
CREATE EXTENSION timescaledb;
```

You can skip this step if you're using Timescale Cloud or Timescale docker
images.

## Download

Download the repository:

https://github.com/jonatas/sql-data-science-training

Use the `schema.sql` file  for the next few steps if you want. Our steps will
be:

1. Create table
2. Create indices
3. Transform the table into hypertable

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
\COPY weather_metrics FROM './data/new_york.csv' DELIMITER ',' CSV HEADER;
\COPY weather_metrics FROM './data/toronto.csv' DELIMITER ',' CSV HEADER;
\COPY weather_metrics FROM './data/stockholm.csv' DELIMITER ',' CSV HEADER;
\COPY weather_metrics FROM './data/princeton.csv' DELIMITER ',' CSV HEADER;
\COPY weather_metrics FROM './data/vienna.csv' DELIMITER ',' CSV HEADER;
```

> copy commands should be executed line by line

## Timing

On psql we can enable timing to check the performance of every command:

```
\timing
```

## Counting

```sql
SELECT count(1) FROM weather_metrics;
```

## Approx. row count

Timescaledb offers a different counting approach that is very approximate to
real counter.

```sql
SELECT approximate_row_count('weather_metrics');
```

# Plotting

> $ md-show global_warming.md "postgres://jonatasdp@localhost:5432/openweather"

- https://github.com/jonatas/md-show
- https://github.com/jonatas/sql-data-science-training

## X & Y


```sql
SELECT
  x, random() as y
FROM
  generate_series(
    now() - INTERVAL '20 seconds',
    now(), INTERVAL '1 second') x
```

## Sin/Cos

```sql
SELECT
  'sin' as name,
   array_agg(now() + make_interval(hours=>i)) as x,
   array_agg(sin(i/ 12.0 * PI())) as y
FROM generate_series(1,168) i
UNION ALL
SELECT
  'cos' as name,
   array_agg(now() + make_interval(hours=>i)) as x,
   array_agg(cos(i/ 12.0 * PI())) as y
FROM generate_series(1,168) i;
```

## type

Type will refer to type chart.

```sql
SELECT
  'bar' as type,
  array_agg(random() * 100) as y,
  array_agg(g) as x
FROM
  generate_series(
    now() - INTERVAL '1 hour',
    now(),
    INTERVAL '1 minute') g GROUP BY 1
```

## title

Title will inject the title in the layout.

```sql
SELECT
  'Total records per city' as title,
  'bar' as type,
  city_name as x,
  count(*) y
FROM weather_metrics
GROUP BY 1,2,3;
```

## name

Name will make it the series name.

```sql
WITH resume as (
  SELECT city_name AS name,
  time_bucket('1 year', time) AS x,
  avg(temp_c) as y
  FROM weather_metrics
  GROUP BY 1,2
  ORDER BY 1,2
)
SELECT name, array_agg(x) as x, array_agg(y) as y
FROM resume
GROUP BY 1
```

## avg

```sql
select time_bucket('1 month', time) as x,
AVG(temp_c) as y
FROM weather_metrics
WHERE time BETWEEN '2022-01-01' and '2023-01-02'
AND city_name = 'Toronto'
GROUP BY 1
ORDER BY 1;
```

## avg hour

```sql
select time_bucket('1 hour', time) as x,
  avg(temp_c) as y
  from weather_metrics
  where time between '2022-01-01' and '2023-01-02'
  and city_name = 'Toronto'
  group by 1
  order by 1;
```


## granularity

    how many records are available per year?

```sql
select time_bucket('1 year', time) as x,
  count(*) as y,
  'bar' as type
  from weather_metrics
  group by 1,3
  order by 1
```

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

Let's start exploring the Time Series Data and answer a few questions.

## Questions

> Answer with sql

* How to adapt the code to work the city time zone?
* How many different cities are available?
* When the data starts and when it ends?
* How many records we have per city?
* What was the average temperature of Toronto in January in the last 10 years.
* What is the hottest and coldest city we're tracking?
* What is the city that rains more?
* Choose a city and investigate the season of the city?

## Time zone

```sql
SELECT time +  timezone_shift::text::interval AS time,
  temp_c AS temperature,
  city_name AS city
FROM weather_metrics ORDER BY 1 DESC LIMIT 5;
```

## Distinct

> What are the name of the cities available?

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
SELECT MIN(time), MAX(time) FROM weather_metrics;
```

## Group

> How many records we have per city?

```sql
SELECT city_name, count(*) FROM weather_metrics GROUP BY 1;
```

## Avg

> What was the average temperature over all times?

```sql
select city_name, avg(temp_c) from weather_metrics  group by 1;
```

## Time Series

**Time Series Analysis in SQL and Timescaledb**

> What was the average temperature of Toronto in January of 2022?

```sql
select avg(temp_c) from weather_metrics
where city_name = 'Toronto'
and time between '2022-01-01' and '2022-01-31';
```

## Year bucket

> What was the average temperature of Toronto in January in the last 10 years.

## Order by

> What is the hottest and coldest city we're tracking?

## Sum

> What is the city that rains more?

## Season

> What is the average temperature and average rain of each season of Toronto?

## Views

Create views for:

* x view: fix the time zone shift
* winter: filter only winter days
* summer: filter only summer days

Use CTEs for minor queries that you're not going to explore further.

## Partitions

Hypertable will partition date by time interval.

Let's run EXPLAIN ANALYZE in the previous query:

```sql
EXPLAIN ANALYZE
select avg(temp_c) from weather_metrics
where city_name = 'Toronto'
and time between '2022-01-01' and '2022-01-31';
```

## Explain

Understanding a bit of the execution plan:

```sql
EXPLAIN SELECT count(1) FROM weather_metrics
WHERE time > now() - INTERVAL '1 month' ;
```

Partitioned tables can divide and conquer!

    ->  Parallel Append  (cost=0.29..56957.24 rows=1023114 width=0)                                                                                    │
    │  ->  Parallel Index Only Scan using _hyper_1_...idx on _hyper_1_...

## time bucket

Get average of temperature grouped by one hour.

```sql
SELECT time_bucket('1 hour', time) AS bucket,
  avg(temp_c)
FROM weather_metrics
 WHERE city_name = 'Toronto'
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
WHERE city_name = 'Toronto'
  AND time BETWEEN '2022-06-01' AND '2022-06-02'
GROUP BY 1 ORDER BY 1;
```

## OHLC

Candlestick pattern: capture values grouped by a timeframe.

    OHLC = Open, High, Low, Close

```sql
SELECT time_bucket('1 hour'::interval, time) AS bucket,
  first(temp_c, time) as open,
  max(temp_c) as high,
  min(temp_c) as low,
  last(temp_c, time) as close
FROM weather_metrics
WHERE city_name = 'Toronto'
  AND time BETWEEN '2022-06-01 06:00:00' AND '2022-06-02 12:00:00'
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
WHERE city_name = 'Toronto'
  AND time BETWEEN '2022-06-01' AND '2022-06-02'
GROUP BY 1 ORDER BY 1;
```

## array_agg

Now going deep into individual values inside this hour:

```sql
 SELECT time_bucket('1 hour'::interval, time) AS bucket,
array_agg( temp_c)
FROM weather_metrics
 WHERE city_name = 'Toronto'
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
 WHERE city_name = 'Toronto'
AND time BETWEEN '2022-06-01 00:00:00' AND '2022-07-01 01:00:00'
GROUP BY 1 ORDER BY 1;
```

The functions with `_agg` suffix' indicates that several statistical aggregates
can be pre-computed and save computing later.

They also support the **pipeline operator**.

# Median from percentile

Extracting the median from the percentile:

```sql
SELECT time_bucket('1 month'::interval, time) AS x,
    approx_percentile(0.5, percentile_agg( temp_c)) as y
  FROM weather_metrics
  WHERE city_name = 'Toronto'
    AND time BETWEEN '2021-06-01 00:00:00' AND '2022-07-01 01:00:00'
  GROUP BY 1 ORDER BY 1;
```

# Pipeline

Allows functional programming in SQL with the pipeline operator `->`.

```sql
SELECT time_bucket('1 month'::interval, time) AS x,
    percentile_agg( temp_c) -> approx_percentile(0.5) as y
  FROM weather_metrics
  WHERE city_name = 'Toronto'
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
 WHERE city_name = 'Toronto'
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
  WHERE city_name = 'Toronto'
    AND time BETWEEN '2021-06-01 00:00:00' AND '2022-07-01 01:00:00'
  GROUP BY 1 ORDER BY 1
)
SELECT bucket as x,
  approx_percentile(0.25, percentile_agg) AS y,
  approx_percentile(0.5, percentile_agg) AS y_median,
  approx_percentile(0.75, percentile_agg) AS y_q3,
  approx_percentile(0.99, percentile_agg) AS y_99
FROM one_month;
```

# Stats aggs

Statistical aggregates in one or two dimensions to pre-compute statistics summary.

```sql
SELECT time_bucket('1 hour'::interval, time) AS bucket,
   stats_agg( temp_c) AS hourly_agg
FROM weather_metrics
 WHERE city_name = 'Toronto'
AND time BETWEEN '2022-06-01 00:00:00' AND '2022-07-01 01:00:00'
GROUP BY 1 ORDER BY 1
```

# Average

Compute an average from stats aggs:

```sql
 SELECT time_bucket('1 hour'::interval, time) AS x,
   average(stats_agg( temp_c)) AS y
FROM weather_metrics
 WHERE city_name = 'Toronto'
AND time BETWEEN '2022-06-01 00:00:00' AND '2022-07-01 01:00:00'
GROUP BY 1 ORDER BY 1
```

# Alias

Using CTE to reuse the stats aggs pre-computed data:

```sql
WITH one_day AS (
  SELECT time_bucket('1 hour'::interval, time) AS bucket,
    stats_agg( temp_c)
  FROM weather_metrics
  WHERE city_name = 'Toronto'
  AND time BETWEEN '2022-06-01 00:00:00-04' AND '2022-06-01 23:59:59-04'
  GROUP BY 1
  ORDER BY 1
)
SELECT bucket as x, average(stats_agg) as y FROM one_day;
```

# Rollup

Rollup can combine stats aggs in different time frames:

```sql
WITH hourly AS (
  SELECT time_bucket('1 hour'::interval, time) AS hour_bucket,
    stats_agg( temp_c)
  FROM weather_metrics
  WHERE city_name = 'Toronto'
  AND time between '2022-06-01 00:00:00' AND '2022-07-01 01:00:00'
  GROUP BY 1 ORDER BY 1
)
SELECT time_bucket('1 day', hour_bucket) as x,
  average(rollup(stats_agg)) as y
FROM hourly GROUP BY 1 ORDER BY 1;
```

# cascade

Cascading rollups can reuse previous stats aggs:

```sql
WITH hourly AS ( SELECT time_bucket('1 hour'::interval, time) AS bucket,
    stats_agg( temp_c) AS hourly_agg
  FROM weather_metrics
  WHERE city_name = 'Toronto'
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
SELECT bucket as x, average(monthly_agg) as y from monthly;
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

# num vals

Querying number of values from pre-computed stats aggs:

```sql
WITH hourly AS (
  SELECT time_bucket('1 hour'::interval, time) AS bucket,
    stats_agg( temp_c) AS hourly_agg
  FROM weather_metrics
  WHERE city_name = 'Toronto'
  AND time BETWEEN '2023-02-01 00:00:00' AND '2023-02-01 12:00:00'
  GROUP BY 1 ORDER BY 1
)
SELECT bucket, average(hourly_agg), num_vals(hourly_agg) from hourly;
```

# CAggs

> AKA Continuous Aggregates ;)

Materialized views for hypertables.

```sql
CREATE MATERIALIZED VIEW hourly_agg
WITH (timescaledb.continuous) AS
SELECT time_bucket('1 hour'::interval, time) AS bucket,
   stats_agg( temp_c) AS hourly_agg
FROM weather_metrics
 WHERE city_name = 'Toronto'
GROUP BY 1;
```

Materialized data can be combined with real time data from open timeframes.

# caggs^2?

```sql
CREATE MATERIALIZED VIEW daily_agg
WITH (timescaledb.continuous) AS
SELECT time_bucket('1 day',bucket),
rollup(hourly_agg) AS daily_agg
FROM hourly_agg group by 1;
```

## Candlesticks

```sql
CREATE MATERIALIZED VIEW weather_hourly
WITH (timescaledb.continuous) AS
    SELECT time_bucket('1 hour'::interval, time),
      city_name,
      candlestick_agg(time, temp_c, 1) as candlestick
    FROM weather_metrics
    GROUP BY 1,2 WITH DATA;
```

# View

```sql
SELECT
  time_bucket as x,
  array_agg(open(candlestick)) as open,
  array_agg(high(candlestick)) as high,
  array_agg(low(candlestick)) as low,
  array_agg(close(candlestick)) as close
FROM weather_hourly
WHERE city_name = 'Toronto'
GROUP BY 1
ORDER BY time_bucket DESC LIMIT 30;
```

# Correlation

```sql
WITH x AS (
    SELECT
        time_bucket ('1 month', time),
        avg(temp_c)
    FROM
        weather_metrics
    WHERE
        city_name = 'Toronto'
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
    time_bucket ('1 y', x.time_bucket) as x,
    covariance(stats_agg(x.avg, nai.avg)) as y,
    corr(stats_agg(x.avg, nai.avg)) as y_covariance
FROM x
    JOIN nai ON x.time_bucket = nai.time_bucket
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
--WHERE b.city_name = 'Toronto' and a.city_name = 'Nairobi'
GROUP BY 1,2
 order by 1, 2
$$::text,
'select distinct city_name from weather_metrics order by 1'::text
) as ct(city_name text,
  "Nairobi" double precision,
  "New York" double precision,
  "Princeton" double precision,
  "Stockholm" double precision,
  "Toronto" double precision,
  "Vienna" double precision);
```

## percentile hour

```sql
with resume as (
  select time_bucket('1 hour', time),
    percentile_agg(temp_c)
  from weather_metrics
  where time between '2023-01-02' and '2023-01-03'
    and city_name = 'Toronto'
  group by 1 order by 1
)
select 'highest' as name,
  array_agg(time_bucket) as x,
  array_agg(approx_percentile(0.99, percentile_agg)) as y
from resume group by 1
union all
select 'lowest' as name,
  array_agg(time_bucket) as x,
  array_agg(approx_percentile(0.01, percentile_agg)) as y
from resume group by 1
order by 1,2;
```

# percentile day

```sql
with resume as (
  select time_bucket('1 month', time),
    percentile_agg(temp_c)
  from weather_metrics
  where time between '2010-01-01' and '2023-01-02'
    and city_name = 'Toronto'
  group by 1 order by 1
)
select 'highest' as name,
  array_agg(time_bucket) as x,
  array_agg(approx_percentile(0.99, percentile_agg)) as y
from resume group by 1
union all
select 'lowest' as name,
  array_agg(time_bucket) as x,
  array_agg(approx_percentile(0.01, percentile_agg)) as y
from resume group by 1
order by 1,2;
```

# percentile year

```sql
with resume as (
  select time_bucket('1 year', time),
    percentile_agg(temp_c)
  from weather_metrics
  where time between '1978-01-01' and '2023-01-02'
    and city_name = 'Toronto'
  group by 1 order by 1
)
select 'highest' as name,
  array_agg(time_bucket) as x,
  array_agg(approx_percentile(0.99, percentile_agg)) as y
from resume group by 1
union all
select 'lowest' as name,
  array_agg(time_bucket) as x,
  array_agg(approx_percentile(0.01, percentile_agg)) as y
from resume group by 1
order by 1,2;
```

## avg vs median - year bucket

```sql
with resume as (
  select time_bucket('1 month', time),
    percentile_agg(temp_c),
    avg(temp_c) as avg
  from weather_metrics
  where time between '2022-01-01' and '2023-01-02'
    and city_name = 'Toronto'
  group by 1 order by 1
),
median as (
  select 'median' as name,
  array_agg(time_bucket) as x,
  array_agg(approx_percentile(0.5, percentile_agg)) as y
  from resume
),
average as (
  select 'average' as name,
  array_agg(time_bucket) as x,
  array_agg(avg) as y
  from resume
)
SELECT * FROM median  UNION ALL
SELECT * FROM average ;
```

## avg vs median - daily bucket

```sql
with resume as (
  select time_bucket('1 day', time),
    percentile_agg(temp_c),
    avg(temp_c) as avg
  from weather_metrics
  where time between '2022-01-01' and '2023-01-02'
    and city_name = 'Toronto'
  group by 1 order by 1
),
median as (
  select 'median' as name,
  array_agg(time_bucket) as x,
  array_agg(approx_percentile(0.5, percentile_agg)) as y
  from resume
),
average as (
  select 'average' as name,
  array_agg(time_bucket) as x,
  array_agg(avg) as y
  from resume
)
SELECT * FROM median
UNION ALL
SELECT * FROM average ;
```

## uddsketch and tdigest

```sql
with resume as (
  select time_bucket('1 year', time),
    percentile_agg(temp_c),
    uddsketch(200, 0.001, temp_c),
    tdigest(200, temp_c),
    avg(temp_c)
  from weather_metrics
  where -- time between '2022-01-01' and '2023-01-02' and
  city_name = 'Toronto'
  group by 1 order by 1
),
median as (
  select 'median' as name,
  array_agg(time_bucket) as x,
  array_agg(approx_percentile(0.5, percentile_agg)) as y
  from resume
),
median_uddsketch as (
  select 'median uddsketch' as name,
  array_agg(time_bucket) as x,
  array_agg(approx_percentile(0.5, uddsketch)) as y
  from resume
),
median_tdigest as (
  select 'median uddsketch' as name,
  array_agg(time_bucket) as x,
  array_agg(approx_percentile(0.5, tdigest)) as y
  from resume
),
average as (
  select 'average' as name,
  array_agg(time_bucket) as x,
  array_agg(avg) as y
  from resume
)
SELECT * FROM median UNION ALL
SELECT * FROM median_uddsketch UNION ALL
SELECT * FROM median_tdigest UNION ALL
SELECT * FROM average ;
```

## p1 and p99

```sql
with resume as (
  select time_bucket('1 month', time),
    percentile_agg(temp_c),
    avg(temp_c) as avg
  from weather_metrics
  where time between '2022-01-01' and '2023-01-02'
    and city_name = 'Toronto'
  group by 1 order by 1
),
p1 as (
  select 'p1' as name,
  array_agg(time_bucket) as x,
  array_agg(approx_percentile(0.01, percentile_agg)) as y
  from resume
),
p99 as (
  select 'p99' as name,
  array_agg(time_bucket) as x,
  array_agg(approx_percentile(0.99, percentile_agg)) as y
  from resume
),
median as (
  select 'median' as name,
  array_agg(time_bucket) as x,
  array_agg(approx_percentile(0.5, percentile_agg)) as y
  from resume
),
average as (
  select 'average' as name,
  array_agg(time_bucket) as x,
  array_agg(avg) as y
  from resume
)
SELECT * FROM median  UNION ALL
SELECT * FROM average UNION ALL
SELECT * FROM p1      UNION ALL
SELECT * FROM p99
```

## lttb

```sql
with x as (
  select (lttb(time, temp_c, 300) -> unnest()).* as pair 
  from weather_metrics
  where time between '1978-01-01' and '2023-01-01'
  and city_name = 'Toronto'
) select x.time as x, x.value as y from x;
```

## lttb vs avg

> What if I compare lttb with averages from buckets?

```sql
WITH resume AS (
  SELECT city_name as name, (lttb(time, temp_c, 720) -> unnest()).* as pair 
  FROM weather_metrics
  WHERE time BETWEEN '2022-01-01' AND '2023-01-01'
  GROUP BY 1
) SELECT name,
array_agg(time) AS x,
array_agg(value) as y
FROM resume
GROUP BY 1;
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
