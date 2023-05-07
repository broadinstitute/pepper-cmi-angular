#!/usr/bin/env bash

mkdir -p playwright-env

export PLAYWRIGHT_VAULT_PATH=secret/${VAULT_PATH}/test/e2e # set base path for all playwright secrets
export sitePwd=$(vault read --format=json $PLAYWRIGHT_VAULT_PATH | jq -r ".data.sitePassword")
echo "export SITE_PASSWORD=$sitePwd" >> playwright-env/envvars

#DSM
export dsmUser=$(vault read --format=json $PLAYWRIGHT_VAULT_PATH | jq -r ".data.users | .[] | select(.app==\"dsm\") | .userName")
export dsmUserPassword=$(vault read --format=json $PLAYWRIGHT_VAULT_PATH | jq -r ".data.users | .[] | select(.app==\"dsm\") | .password")
echo "export DSM_USER_EMAIL=$dsmUser" >> playwright-env/envvars
echo "export DSM_USER_PASSWORD=$dsmUserPassword" >> playwright-env/envvars

# ANGIO
export angioUser=$(vault read --format=json $PLAYWRIGHT_VAULT_PATH | jq -r ".data.users | .[] | select(.app==\"angio\") | .userName")
export angioUserPassword=$(vault read --format=json $PLAYWRIGHT_VAULT_PATH | jq -r ".data.users | .[] | select(.app==\"angio\") | .password")
echo "export ANGIO_USER_PASSWORD=$angioUserPassword" >> playwright-env/envvars
echo "export ANGIO_USER_EMAIL=$angioUser" >> playwright-env/envvars

# PANCAN
export pancanUser=$(vault read --format=json $PLAYWRIGHT_VAULT_PATH | jq -r ".data.users | .[] | select(.app==\"pancan\") | .userName")
export pancanUserPassword=$(vault read --format=json $PLAYWRIGHT_VAULT_PATH | jq -r ".data.users | .[] | select(.app==\"pancan\") | .password")
echo "export PANCAN_USER_PASSWORD=$pancanUserPassword" >> playwright-env/envvars
echo "export PANCAN_USER_EMAIL=$pancanUser" >> playwright-env/envvars

# OSTEO
export osteoUser=$(vault read --format=json $PLAYWRIGHT_VAULT_PATH | jq -r ".data.users | .[] | select(.app==\"osteo\") | .userName")
export osteoUserPassword=$(vault read --format=json $PLAYWRIGHT_VAULT_PATH | jq -r ".data.users | .[] | select(.app==\"osteo\") | .password")
echo "export OSTEO_USER_PASSWORD=$osteoUserPassword" >> playwright-env/envvars
echo "export OSTEO_USER_EMAIL=$osteoUser" >> playwright-env/envvars

# BRAIN
export brainUser=$(vault read --format=json $PLAYWRIGHT_VAULT_PATH | jq -r ".data.users | .[] | select(.app==\"brain\") | .userName")
export brainUserPassword=$(vault read --format=json $PLAYWRIGHT_VAULT_PATH | jq -r ".data.users | .[] | select(.app==\"brain\") | .password")
echo "export BRAIN_USER_PASSWORD=$brainUserPassword" >> playwright-env/envvars
echo "export BRAIN_USER_EMAIL=$brainUser" >> playwright-env/envvars

# EMAIL TESTING
export refreshToken=$(vault read --format=json $PLAYWRIGHT_VAULT_PATH | jq -r ".data.email.refreshToken")
export emailClientId=$(vault read --format=json $PLAYWRIGHT_VAULT_PATH | jq -r ".data.email.clientId")
export emailClientSecret=$(vault read --format=json $PLAYWRIGHT_VAULT_PATH | jq -r ".data.email.clientSecret")
export emailRedirectUri=$(vault read --format=json $PLAYWRIGHT_VAULT_PATH | jq -r ".data.email.redirectUri")
export emailWaitTime=$(vault read --format=json $PLAYWRIGHT_VAULT_PATH | jq -r ".data.email.minWaitTime")
echo "export EMAIL_REFRESH_TOKEN=$refreshToken" >> playwright-env/envvars
echo "export EMAIL_CLIENT_ID=$emailClientId" >> playwright-env/envvars
echo "export EMAIL_CLIENT_SECRET=$emailClientSecret" >> playwright-env/envvars
echo "export EMAIL_REDIRECT_URL=$emailRedirectUri" >> playwright-env/envvars
echo "export MIN_EMAIL_WAIT_TIME=$emailWaitTime" >> playwright-env/envvars
