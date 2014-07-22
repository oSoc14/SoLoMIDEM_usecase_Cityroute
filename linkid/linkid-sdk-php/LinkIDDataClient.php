<?php

require_once('LinkIDDataWSSoapClient.php');
require_once('LinkIDSaml2.php');
//require_once('../util/simplexml_tree.php');

/*
 * linkID Attribute WS client
 *
 * @author Wim Vandenhaute
 */

class LinkIDDataClient
{

    private $client;

    /**
     * Constructor
     */
    public function __construct($linkIDHost, $username, $password)
    {

        $wsdlLocation = "https://" . $linkIDHost . "/linkid-ws-username/data?wsdl";

        // need to enable trace to parse the soap response manually using simplexml
        // this is due to some out of spec xml attributes we are setting for specifying the attributeId
        $options = Array(
            "trace" => 1,
        );

        $this->client = new LinkIDDataWSSoapClient($wsdlLocation, $options);
        $this->client->__setUsernameToken($username, $password, 'PasswordDigest');
    }

    public function getAttributes($userId, $attributeName)
    {

        $requestParams = new stdClass;
        $requestParams->QueryItem = new stdClass;
        $requestParams->QueryItem->Select = $attributeName;

        // add target identity header
        $this->addIdentityHeader($userId);

        /** @noinspection PhpUndefinedMethodInspection */
        $response = $this->client->query($requestParams);
        // need to parse the raw xml string due to the custom linkID attributes for the attributeId
        $raw = $this->client->__getLastResponse();
        $xml = new SimpleXMLElement($raw);

        // validate response status
        $this->validateResponse($response);

        // parse attributes
        $linkIDSaml2 = new LinkIDSaml2();

        if (null != $xml->children("http://schemas.xmlsoap.org/soap/envelope/")->Body[0]->children("urn:liberty:dst:2006-08:ref:safe-online")->QueryResponse[0]->Data[0]) {
            $attributes = $xml->children("http://schemas.xmlsoap.org/soap/envelope/")->Body[0]->children("urn:liberty:dst:2006-08:ref:safe-online")->QueryResponse[0]->Data[0]->children("urn:oasis:names:tc:SAML:2.0:assertion");
            return $linkIDSaml2->getAttributes($attributes);
        } else {
            // nothing found
            return null;
        }

    }

    public function setAttribute($userId, $attribute)
    {

        $requestParams = new stdClass;
        $requestParams->ModifyItem = new stdClass;

        // pass attributes to SOAP client, will create the request there using the DOM api
        $this->client->__setAttribute($attribute);

        // add target identity header
        $this->addIdentityHeader($userId);

        /** @noinspection PhpUndefinedMethodInspection */
        $response = $this->client->modify($requestParams);

        // validate response status
        $this->validateResponse($response);
    }

    public function removeAttribute($userId, $attribute)
    {

        $requestParams = new stdClass;
        $requestParams->DeleteItem = new stdClass;

        // pass attributes to SOAP client, will create the request there using the DOM api
        $this->client->__setAttribute($attribute);

        // add target identity header
        $this->addIdentityHeader($userId);

        /** @noinspection PhpUndefinedMethodInspection */
        $response = $this->client->delete($requestParams);

        // validate response status
        $this->validateResponse($response);
    }

    public function addIdentityHeader($userId)
    {

        $targetIdentityXml = '<nsTI:TargetIdentity xmlns:nsTI="urn:liberty:sb:2005-11" SOAP-ENV:mustUnderstand="1"><saml:Subject xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"><saml:NameID>' . $userId . '</saml:NameID></saml:Subject></nsTI:TargetIdentity>';
        $this->client->__addHeader(new SoapHeader('urn:liberty:sb:2005-11', 'TargetIdentity', new SoapVar($targetIdentityXml, XSD_ANYXML), true));
    }

    public function validateResponse($response)
    {

        $statusCode = $response->Status->code;
        if ($statusCode != "OK") {

            $secondLevelStatusCode = $response->Status->Status->code;
            $comment = $response->Status->Status->comment;

            throw new Exception("DataWS failed: " . $comment . "statusCode: " . $statusCode . "secondLevelStatusCode: " . $secondLevelStatusCode);
        }

    }

}

?>
