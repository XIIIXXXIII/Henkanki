# Platform Targets

Henkanki aims to run almost anywhere through multiple editions and support levels.
This document is aspirational, but it separates realistic official releases from experimental and historical ports.

## Support levels

| Level | Meaning |
| --- | --- |
| Official | Project-built, tested, and released. |
| Supported | Expected to work; tested when practical. |
| Experimental | Builds may exist; bugs and missing features are expected. |
| Legacy | Old systems with reduced features. |
| Historical | Retro/source/community experiment only. |

## Primary operating systems

| Platform | Architectures | Level | Preferred edition |
| --- | --- | --- | --- |
| Web/PWA | wasm32 | Official | Web |
| Windows 10/11 | x86_64, ARM64 | Official | Desktop, CLI |
| macOS modern | ARM64, x86_64 | Official | Desktop, CLI |
| Linux modern | x86_64, ARM64 | Official | Desktop, CLI |
| Android modern | ARM64, ARMv7, x86_64 | Official | Mobile, Web |
| iOS/iPadOS modern | ARM64 | Official | Mobile, Web |
| ChromeOS | x86_64, ARM64 | Supported | Web, Android, Linux |
| Raspberry Pi OS | ARM64, ARMv7, ARMv6 | Supported | CLI, Web |
| FreeBSD | x86_64, ARM64 | Supported | CLI, Desktop-lite |
| Alpine Linux | x86_64, ARM64 | Supported | CLI, Docker |
| SteamOS | x86_64 | Supported | Desktop, Web |

## Experimental operating systems

| Platform | Architectures | Preferred edition |
| --- | --- | --- |
| OpenBSD | x86_64, ARM64 | CLI |
| NetBSD | x86_64, ARM64, many community targets | CLI |
| DragonFly BSD | x86_64 | CLI |
| Haiku | x86_64, x86 | CLI first, GUI later |
| ReactOS | x86, x86_64 | Windows-compatible experiment |
| illumos/OpenIndiana | x86_64 | CLI |
| SerenityOS | x86_64 | Source/CLI experiment |
| Redox OS | x86_64 | Source/CLI experiment |
| Plan 9 / 9front | x86, x86_64 | Lite/source experiment |

## Legacy and historical operating systems

| Family | Target examples | Preferred edition |
| --- | --- | --- |
| Windows legacy | Windows 7, 8, 8.1, Vista, XP, 2000, 9x | Lite, Retro |
| Apple legacy | old OS X, PowerPC Mac OS X, Classic Mac OS | Lite, Retro |
| Android legacy | Android 1.x through older 4.x/5.x releases | Lite, Retro |
| iOS legacy | iPhone OS / old iOS releases | Retro research |
| BeOS family | BeOS, ZETA, early Haiku | Retro |
| Amiga family | AmigaOS, MorphOS, AROS | Retro |
| Mobile legacy | Symbian, Palm OS, BlackBerry, webOS, Windows Phone | Retro |
| Alternative systems | RISC OS, MINIX, TempleOS-like experiments | Historical only |

## Architecture targets

| Architecture | Level |
| --- | --- |
| x86_64 / amd64 | Official |
| ARM64 / AArch64 | Official |
| x86 / i386 / i686 32-bit | Legacy |
| ARMv7 | Supported |
| ARMv6 | Experimental |
| RISC-V 64 | Experimental moving toward Supported |
| RISC-V 32 | Experimental |
| PowerPC 64/32 | Historical/community |
| MIPS 64/32 | Historical/community |
| LoongArch64 | Experimental/community |
| SPARC64 | Historical/community |
| s390x | Community/server |
| m68k, Alpha, PA-RISC, Itanium, SuperH | Historical only |
| wasm32 | Official for Web |
| WASI | Experimental portable runtime |

## Rule of honesty

The project may target everything, but it must never imply that Android 1.x, iPhone OS 1.x, Windows 95, and modern Windows 11 receive the same feature set or test coverage.
