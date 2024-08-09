# Changelog

All notable changes to this project will be documented in this file.

## [v1.2.3] - 2024-08-09

- Update production SAME_SITE_POLICY to none in create-env-file.sh

## [v1.2.2] - 2024-08-09

- Update production FRONTEND_HOST in create-env-file.sh
- Fix project query creator findOne current user data by adding missing subquery
- Refactor UserAffiliationShowDto to remove unused id property

## [v1.2.1] - 2024-08-08

- Remove passphrase from SSH configuration in cd.yml
- Remove USER_PASSWORD env var use in cd.yml

## [v1.2.0] - 2024-08-08

- Terraform manifests
- Profile routes
- Users put/push routes
- Enrollments routes
