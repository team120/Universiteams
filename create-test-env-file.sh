#!/bin/bash
# TODO: Take any sensible secret as script arguments

ENV_FILE='docker.test.env'

if [[ -f "$ENV_FILE" ]]
then
    echo "$ENV_FILE already exists"
    exit 1
fi

FRONTEND_HOST="http://localhost:3000"

touch $ENV_FILE
echo POSTGRES_HOST="postgrestest" >> $ENV_FILE
echo POSTGRES_PORT=5432 >> $ENV_FILE
echo POSTGRES_DB="postgrestest" >> $ENV_FILE
echo POSTGRES_USER="admin" >> $ENV_FILE
echo POSTGRES_PASSWORD="admin" >> $ENV_FILE
echo REDIS_HOST="redistest" >> $ENV_FILE
echo REDIS_PORT=6379 >> $ENV_FILE
echo ACCESS_TOKEN_SECRET="access_token_test_secret" >> $ENV_FILE
echo REFRESH_TOKEN_SECRET="refresh_token_test_secret" >> $ENV_FILE
echo EMAIL_VERIFICATION_LINK_SECRET="verification_link_secret" >> $ENV_FILE
echo FORGET_PASSWORD_VERIFICATION_LINK_SECRET="forget_password_verification_link_secret" >> $ENV_FILE
echo FORGET_PASSWORD_URL="$FRONTEND_HOST/account/reset-password" >> $ENV_FILE
echo EMAIL_USER="email@example.com" >> $ENV_FILE
echo EMAIL_CONFIRMATION_URL="$FRONTEND_HOST/account/verify" >> $ENV_FILE
echo SAME_SITE_POLICY="none" >> $ENV_FILE
echo SECURE_COOKIE="true" >> $ENV_FILE