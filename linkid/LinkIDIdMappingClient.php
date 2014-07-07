<?php

require_once('LinkIDIdMappingWSSoapClient.php');

/*
 * linkID IdMapping WS client
 *
 * @author Wim Vandenhaute
 */

class LinkIDIdMappingClient
{

    private $client;

    /**
     * Constructor
     */
    public function __construct($linkIDHost, $username, $password)
    {

        $wsdlLocation = "https://" . $linkIDHost . "/linkid-ws-username/idmapping?wsdl";

        $this->client = new LinkIDIdMappingWSSoapClient($wsdlLocation);
        $this->client->__setUsernameToken($username, $password, 'PasswordDigest');
    }

    public function getUserId($attributeName, $identifier)
    {

        $requestParams = new stdClass;
        $requestParams->NameIDPolicy = new stdClass;

        // pass attributes to SOAP client, will create the request there using the DOM api
        $this->client->__setAttributeName($attributeName);
        $this->client->__setIdentifier($identifier);

        /** @noinspection PhpUndefinedMethodInspection */
        $response = $this->client->nameIdentifierMappingQuery($requestParams);

        // validate response status
        $statusCode = $response->Status->StatusCode->Value;
        if ($statusCode != "urn:oasis:names:tc:SAML:2.0:status:Success") {

            $secondLevelStatusCode = $response->Status->StatusCode->StatusCode->Value;
            throw new Exception("Failed to get userId: " . $secondLevelStatusCode);
        }

        return $response->NameID->_;

    }

}