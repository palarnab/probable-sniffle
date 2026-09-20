# Security Policy

## Reporting a vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Report them privately through [GitHub Security Advisories](https://github.com/palarnab/probable-sniffle/security/advisories/new). If that is unavailable to you, open a minimal public issue that says only "security issue — requesting private contact" with no technical detail, and a maintainer will follow up.

Please include:

- Type of issue (e.g. path traversal, SSRF, deserialization, injection)
- Affected service — frontend, backend, or analyzer
- Steps to reproduce, ideally with a proof of concept
- Impact — what an attacker could achieve

You can expect an initial response within a few days and a fix or mitigation plan once the report is confirmed.

---

## Known limitations of the default configuration

This project is research software configured for **local development**. The defaults are deliberately permissive and are **not** production-safe. Known gaps, stated openly rather than hidden:

| Area | Current state |
|---|---|
| Authentication | None. All API endpoints are unauthenticated. |
| `JWT_SECRET` | Ships as the placeholder `CHANGE_ME_IN_PRODUCTION`. |
| MongoDB | No authentication; port published to the host in `docker-compose.yml`. |
| Redis | No authentication; port published to the host in `docker-compose.yml`. |
| Transport | Plain HTTP. No TLS. |
| Uploads | DICOM files written to local disk unencrypted. |
| Audit logging | None. |
| PHI handling | No de-identification is performed on upload. |

### Before deploying anywhere shared

1. Set a strong, randomly generated `JWT_SECRET`.
2. Enable auth on MongoDB and Redis, and remove their `ports:` mappings so they stay on the internal Docker network.
3. Terminate TLS at a reverse proxy in front of the services.
4. Add authentication and authorization to the backend API.
5. Restrict `CORS_ORIGIN` to your actual frontend origin.
6. Add audit logging if any real study data will flow through the system.

---

## Handling patient data

**Use de-identified imaging only.** This software performs no de-identification, provides no audit trail, and is not HIPAA or GDPR compliant as shipped. Processing protected health information with it — and any consequence of doing so — is solely the responsibility of the operator.

If you discover that PHI has been committed to this repository, report it privately using the process above so history can be purged.
