-- P2 India localization
-- Make India the application default without changing lifecycle semantics.

alter table public.organizations
  alter column timezone set default 'Asia/Kolkata',
  alter column default_currency set default 'INR';

alter table public.opportunities
  alter column currency set default 'INR';

update public.organizations
set timezone = 'Asia/Kolkata'
where timezone = 'UTC' or timezone is null;

update public.organizations
set default_currency = 'INR'
where default_currency = 'USD' or default_currency is null;

update public.opportunities
set currency = 'INR'
where currency = 'USD' or currency is null;

update public.businesses
set country = 'India'
where country is null or trim(country) = '';
