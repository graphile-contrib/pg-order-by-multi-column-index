drop schema if exists p cascade;

create schema p;

create table p.person (
  id serial primary key,
  first_name text not null,
  last_name text not null
);

create index on p.person (last_name ASC, first_name ASC);

create table p.foo (
  id serial primary key,
  col_a text not null,
  col_b text
);

create index on p.foo (col_a ASC, col_b DESC NULLS LAST);