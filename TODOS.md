[x] ~~Replace TRPC with Hono & Hono RPC~~
[] ~~Merge trpc and hono for client side app server~~ -- This isn't as simple as TRPC has better query integration... 
[] however ^^ maybe this could be re-architected with page loading (loaders).
[x] Add ~~eslint~~ biome
[] Using biome add more strict rules.
[] See if `destinationsSchema` can be simplified.
[] Pagination for `getNotAvailableEvaluations` query.
[] Pagination for `getEvaluations` query.
[x] Remove `moment` dependency and use native date functions.
[] Add moonrepo to manage monorepo (follow their best practices)
[] Tests for all packages
[] The monorepo is set up funnily. The data-ops requires a tsc to define definition files before other packages can use it. Fix this.
[] FIX: Use relative imports.

--- Section
[] Make a more sophisticated CI CD pipeline

- [] Tests
- [] Linting
- [] prevent merges if tests or linting fail
- [] Deploy to staging
- [] Deploy to production

--- Section
[] Fix up duplicated date link click filtering queries `packages/data-ops/src/queries/links.ts`
[] Remove magic numbers from ^

--- Stretch goals

[] Add premium features
[] Pro users get analytics / alerts if old links are clicked
[] EX: Email when dead links are clicked
[] EX: Analytics dashboard for link clicks over time

--- Stretch goals CTD
[] Custom short links (user defined names)
[] Custom Domains - prefix for business names - or C name for domain to forwards to ours (white labeling)
[] Delete links (Premium analytics for deleted links being triggered) -- (Premium or allow custom "fallback" pages with links and names for user to click)
[] Smarter Evaluation Logic - AI logic to process page and content to determine if the product is still available or not
[] Smarter Evaluation Scheduling - When is best to trigger the evaluations instead of a few days after. (Premium frequency settings)

--- Section CTD
[] Admin evaluation UI
[] OPT Pick a framework for an Admin interface for us to manage the accounts with our own dashboards
[] OPT - Have an admin page to show how well our AI predictions are doing (showing screenshots taken)
[] OPT - Admin page to manage user accounts (suspend, delete, upgrade, downgrade, etc)
[] OPT - Admin page to manage billing issues (failed payments, refunds, etc)
[] OPT - Admin page to highlight potentially bad links

# Notes

# Links used

- https://console.cloud.google.com/auth/clients?project=famous-sunbeam-477714-c2
- https://dash.cloudflare.com/0d1928a602644566830d45fc4f10cea6/workers/services
- https://github.com/s-petey/full-stack-on-cloudlare-starter-repo

- http://localhost:3000/app
- http://localhost:8787
