# Check package.json for "next" before installing an extracted archive

**Type:** correction

The first excel-ces-sprint1.tar.gz extracted to an Express/Node backend
(nodemon, express, cors) instead of the Next.js app, and half a day went into
setup and debugging before `type package.json` exposed it. Rule: immediately
after extracting any starter archive, confirm the dev script is `next dev` and
`next` is in dependencies. Wrong archive → stop, get the right one; don't patch.
