<h1>
  <p align="center">
  Dejamu 🛌
  </p>
</h1>

<p align="center">
Small Static Site Generator for Deno.
</p>

# Initialize the site
```sh
echo "(await import('https://esm.sh/gh/ikasoba/dejamu/scripts/init.ts')).main();" | deno run -rA -
```

# Build the site
```sh
deno tasks build
```

# Start the local server
```sh
deno tasks serve
```