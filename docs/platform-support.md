# Platform Support Policy

Henkanki distinguishes **source compatibility**, **build verification**, and **published support**. A directory or a source file does not constitute platform support. A route is considered available only after its local dependencies are discovered and its automated test completes.

| Level | Platforms | Release commitment | Scope |
|---|---|---|---|
| Official | Linux `x86_64`, FreeBSD `amd64` CLI | Tested core/CLI on every release; published source and package recipe | Core text routes plus installed local adapters |
| Supported | Haiku `x86_64` CLI | Recipe and documented test procedure; community runner or maintainer validation required for binary releases | Text routes first; optional adapter availability varies |
| Experimental | OpenBSD, NetBSD, DragonFly BSD, illumos, Haiku `x86_gcc2`, RISC-V/ARM targets | Source build path and issue tracking only | Core and text routes; no release timing guarantee |
| Client target | Windows, macOS, Android, iOS | CLI/PWA clients are documented; desktop/mobile artifacts are built on their respective hosts | Per-client capability matrix |

The CLI is the reference local engine. The PWA intentionally exposes browser-safe text routes only. The desktop wrapper invokes the CLI through explicit argument vectors and never fabricates a conversion when an adapter is absent.

## FreeBSD

`packaging/freebsd/` contains an early ports tree draft. FreeBSD users can run the source release directly with a supported Node.js package, then use `henkanki doctor` to inspect optional tools. The port should be accepted as a published package only after a clean `poudriere` build and runtime smoke test on a supported FreeBSD release.[1]

## Haiku

`packaging/haiku/` contains a HaikuPorts recipe deliberately marked experimental until it is built by HaikuPorts. Haiku uses packages, the HaikuDepot and package-management infrastructure; Henkanki therefore targets a `.hpkg` workflow rather than treating an unpacked archive as a formal installation.[2]

### References

[1]: https://docs.freebsd.org/en/books/porters-handbook/ "FreeBSD Porter's Handbook"
[2]: https://www.haiku-os.org/docs/develop/packages/Infrastructure.html "Haiku Package Management Infrastructure"
