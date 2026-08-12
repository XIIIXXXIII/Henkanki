# Henkanki FreeBSD port draft. Submit to FreeBSD Ports only after a poudriere build.
PORTNAME=       henkanki
DISTVERSION=    1.0.0.b1
CATEGORIES=     converters
MASTER_SITES=   https://github.com/XIIIXXXIII/Henkanki/archive/refs/tags/v${DISTVERSION:S/.b/.0-beta./}.tar.gz?dummy=/
DISTNAME=       Henkanki-${DISTVERSION:S/.b/.0-beta./}

MAINTAINER=     ports@henkanki.io
COMMENT=        Local-first, capability-aware file converter
WWW=            https://github.com/XIIIXXXIII/Henkanki

LICENSE=        MIT
USES=           nodejs:20,run
NO_BUILD=       yes
NO_ARCH=        yes

do-install:
	@${MKDIR} ${STAGEDIR}${DATADIR}
	@cd ${WRKSRC} && ${COPYTREE_SHARE} "apps packages plugins node_modules package.json pnpm-lock.yaml" ${STAGEDIR}${DATADIR}
	@${MKDIR} ${STAGEDIR}${PREFIX}/bin
	@${ECHO_CMD} '#!/bin/sh' > ${STAGEDIR}${PREFIX}/bin/henkanki
	@${ECHO_CMD} 'exec ${LOCALBASE}/bin/node ${DATADIR}/apps/cli/henkanki.mjs "$$@"' >> ${STAGEDIR}${PREFIX}/bin/henkanki
	@${CHMOD} 755 ${STAGEDIR}${PREFIX}/bin/henkanki

.include <bsd.port.mk>
