# Windows dev setup: execution policy + always run from the project directory

**Type:** confirmed approach

Two recurring Windows issues. (1) npm fails with PSSecurityException until
`Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned` is run
once. (2) Several failures traced to commands run from C:\Users\torax or
C:\WINDOWS\System32 instead of the project folder — npm error ENOENT on
package.json, "Could not find Prisma Schema", tar failing to find the archive.
Rule: confirm the prompt shows ...\Downloads\excel-ces before any project
command.
