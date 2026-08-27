# Security Policy

## Supported Versions

We release patches for security vulnerabilities in the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of our bouldering competition software seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### Where to Report

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to: **[your-email@example.com]**

You should receive a response within 48 hours. If for some reason you do not, please follow up via email to ensure we received your original message.

### What to Include

Please include the following information in your report:

- Type of vulnerability
- Full paths of source file(s) related to the manifestation of the vulnerability
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

### What to Expect

- **Acknowledgment**: We will acknowledge receipt of your vulnerability report within 48 hours
- **Communication**: We will keep you informed of the progress towards a fix
- **Verification**: We may ask for additional information or guidance
- **Fix Timeline**: We will aim to release a fix within 30 days
- **Credit**: We will credit you in the security advisory (if you wish)

## Security Best Practices

### For Developers

1. **Never commit sensitive data**
   - Always use `.env` files for credentials
   - Never commit `.env` files to version control
   - Use `.env.example` as a template

2. **Firebase Security**
   - Keep Firebase API keys secure
   - Configure proper Firebase Security Rules
   - Use authentication in production
   - Limit database access based on user roles

3. **Dependencies**
   - Regularly update dependencies
   - Use `npm audit` to check for vulnerabilities
   - Review security advisories

4. **Code Review**
   - Review all pull requests for security issues
   - Check for XSS vulnerabilities
   - Validate all user inputs

### For Production Deployments

1. **Environment Variables**
   - Use environment-specific Firebase projects
   - Never expose production credentials in client code
   - Use platform-specific secret management

2. **Firebase Security Rules**
   ```json
   {
     "rules": {
       "students": {
         ".read": "auth != null",
         ".write": "auth != null && auth.token.admin == true"
       },
       "scores": {
         ".read": "auth != null",
         ".write": "auth != null && auth.token.judge == true"
       }
     }
   }
   ```

3. **HTTPS Only**
   - Always use HTTPS in production
   - Configure HSTS headers
   - Use secure cookies if implementing authentication

4. **Data Privacy**
   - This application is NOT designed for storing sensitive PII
   - Comply with GDPR/local data protection laws
   - Implement data retention policies
   - Add privacy policy if collecting personal data

## Known Security Limitations

### Current Implementation

1. **No Authentication**
   - Current version has open access to all features
   - Anyone with the URL can add/edit/delete data
   - **Recommendation**: Add Firebase Authentication before production use

2. **Client-Side Validation Only**
   - All validation happens in the browser
   - **Recommendation**: Add server-side validation via Firebase Functions

3. **Public Firebase Credentials**
   - Firebase config is exposed in client code (this is normal for client apps)
   - **Mitigation**: Use Firebase Security Rules to protect data
   - **Mitigation**: Use separate Firebase projects for dev/staging/prod

## Security Updates

We will announce security updates through:
- GitHub Security Advisories
- Release notes in CHANGELOG.md
- Email to maintainers (if critical)

## Compliance

This application should:
- Not store sensitive personal information (PII)
- Not process payment information
- Not handle medical records
- Not store authentication credentials (passwords)

If you plan to use this for purposes beyond competition scoring, please conduct a security audit first.

## Bug Bounty Program

We do not currently have a bug bounty program.

## Additional Resources

- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [React Security Best Practices](https://react.dev/learn/keeping-components-pure)

---

**Last Updated**: March 2, 2026
