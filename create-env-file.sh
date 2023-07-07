#!/bin/bash

for ARGUMENT in "$@"
do
    KEY=$(echo $ARGUMENT | cut -f 1 -d '=')
    KEY_LENGTH=${#KEY}

    VALUE=${ARGUMENT:$KEY_LENGTH + 1}

    echo "$KEY=$VALUE"
    export "$KEY"="$VALUE"
done

if [ $ENV == 'dev' ]
then
    ENV_FILE='docker.dev.env'
else
    ENV_FILE='docker.prod.env'
fi


if [[ -f "$ENV_FILE" ]]
then
    echo "$ENV_FILE already exists"
    exit 1
fi

touch $ENV_FILE
echo POSTGRES_HOST="postgres" >> $ENV_FILE
echo POSTGRES_PORT="5432" >> $ENV_FILE
echo POSTGRES_USER=$POSTGRES_USER >> $ENV_FILE
echo POSTGRES_PASSWORD=$POSTGRES_PASSWORD >> $ENV_FILE
echo POSTGRES_DB="universiteams" >> $ENV_FILE
echo REDIS_HOST="redis" >> $ENV_FILE
echo REDIS_PORT="6379" >> $ENV_FILE
echo ACCESS_TOKEN_SECRET=$ACCESS_TOKEN_SECRET >> $ENV_FILE
echo REFRESH_TOKEN_SECRET=$REFRESH_TOKEN_SECRET >> $ENV_FILE
echo EMAIL_VERIFICATION_LINK_SECRET=$EMAIL_VERIFICATION_LINK_SECRET >> $ENV_FILE
echo FORGET_PASSWORD_VERIFICATION_LINK_SECRET=$FORGET_PASSWORD_VERIFICATION_LINK_SECRET >> $ENV_FILE
echo FORGET_PASSWORD_URL="http://localhost:5000/account/reset-password" >> $ENV_FILE
echo EMAIL_USER=$EMAIL_USER >> $ENV_FILE
echo EMAIL_CONFIRMATION_URL="http://localhost:5000/account/verify" >> $ENV_FILE
echo SENDGRID_API_KEY=$SENDGRID_API_KEY >> $ENV_FILE
echo SENDINBLUE_API_KEY=$SENDINBLUE_API_KEY >> $ENV_FILE

if [ $ENV = "dev" ]
then
    echo FRONTEND_HOST="http://localhost:3000" >> $ENV_FILE
else
    echo FRONTEND_HOST="TO_BE_DEFINED" >> $ENV_FILE
fi
