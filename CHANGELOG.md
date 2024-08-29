# Changelog

All notable changes to this project will be documented in this file.

## [v1.7.1] - 2024-08-29

- Revert merge of pull request #189 from team120/188-only-allow-leaders-to-kick-or-promote-users

## [v1.7.0] - 2024-08-29

- Merge pull request #190 from team120/999-check-and-modify-for-all-returning-api-messages-from-english-to-spanish
- Merge pull request #189 from team120/188-only-allow-leaders-to-kick-or-promote-users

## [v1.6.0] - 2024-08-29

- Merge pull request #186 from team120/172-check-for-all-unique-fields-in-application-and-update-database
- Merge pull request #185 from team120/feat/174-send-email-when-a-user-request-enrollment-to-a-project

## [v1.5.0] - 2024-08-28

- Merge pull request #187 from team120/178-implement-a-specific-error-type-for-foreign-key-violations
- Merge pull request #171 from team120/138-admin-promotion-endpoint-superadmin-only
- Merge pull request #170 from team120/157-remove-projectrefcounter-and-userrefcounter-from-interest-entity

## [v1.4.4] - 2024-08-20

- Fix bug when registering a department in profile route

## [v1.4.3] - 2024-08-19

- Add missing 'newrelic' import for cloud logging configuration

## [v1.4.2] - 2024-08-17

- Remove 'newrelic' import from main.ts

## [v1.4.1] - 2024-08-17

- Refactor deployment workflow and add New Relic integration

## [v1.4.0] - 2024-08-14

- Fix verification email link
- Merge pull request #162 from team120/161-delete-project-endpoint--update-project-add-leader-validation
- Merge pull request #163 from team120/147-use-transactions-when-a-route-involves-multiple-steps-that-need-to-either-all-succeed-or-all-fail
- Merge pull request #164 from team120/fix/not-displaying-new-projects-get-all

## [v1.3.2] - 2024-08-13

- Dummy release to fix deploy pipeline

## [v1.3.1] - 2024-08-13

- Dummy release to fix deploy pipeline

## [v1.3.0] - 2024-08-13

- Fix Refresh Token handling
- Logout endpoint implemented
- Crud for institutions facility departments (admin only)
- Remove referenceOnly property from ResearchDepartment entity
- Remove referenceOnly property from Project entity

## [v1.2.5] - 2024-08-10

- Fix page not found when trying to visit verify email link
- Refactor verifyEmail method in AuthController to generate and append new token cookies, so previous ones with old data are invalidated

## [v1.2.4] - 2024-08-09

- Fix production deployment ssl config

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
