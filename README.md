# Data Science with PostgreSQL Workshop

This workshop covers the basics of data science with PostgreSQL. The workshop
includes a tutorial in the form of a Markdown document and a command-line tool
that parses the Markdown document and serves it as an HTML presentation.

## Requirements for the training

- PostgreSQL
- TimescaleDB extension

Or just sign up for [Timescale Cloud](https://cloud.timescale.com).

## Installation

Clone this repository:

```bash
git clone  https://github.com/jonatas/sql-data-science-training
cd sql-data-science-training
```

## Preview usage

I run almost all my presentation on VIM using [presenting.vim](https://github.com/sotte/presenting.vim)
but I also build a special markdown preview to allow me to run the examples and plot the data from query results
to make it clear in some cases.

I build [md-show](https://github.com/jonatas/md-show) to help me with my presentations.
It works as a command-line tool to serve the markdown content as an HTML content
and I added some extra features to focus in presentation mode, allowing me to
use it during my talks.

You can install and run it if you have ruby available in your computer.

```bash
gem install md-show
md-show training.md <PG_URI>
```


Where `PG_URI` is a postgresql URI connection. Example: `postgres://jonatasdp@localhost:5432/playground`

Replace `tutorial.md` with the filename of your Markdown document, and `<PG_URI>` with the URI for your PostgreSQL server.

The HTML presentation will be served on http://localhost:4567. You can navigate through the presentation using the left and right arrow keys, or by clicking the "Previous" and "Next" buttons.

### Features

The HTML presentation includes the following features:

- Syntax highlighting for SQL code snippets using Prism.js
- Click in the SQL code to run the snippet and display the results.
- Automatic slide deck creation based on Markdown headers (H1 and H2)
- Simple plotting of data as a scatter plot when the result contains columns named "x" and "y"

# Sessions

* [PGConf India - 2023](http://pgconf.in/conferences/pgconfin2023)
* [JOnTheBeach - 2023](https://jonthebeach.com/workshops/Reality-of-global-warming.-Data-Science-with-Postgres-and-TimescaleDB)
* [PGCon - 2023](https://www.pgcon.org/events/pgcon_2023/schedule/)
