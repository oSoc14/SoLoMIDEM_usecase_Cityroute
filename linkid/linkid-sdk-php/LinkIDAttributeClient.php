<?php

require_once('LinkIDWSSoapClient.php');
require_once('LinkIDSaml2.php');

/*
 * linkID Attribute WS client
 *
 * @author Wim Vandenhaute
 */

class LinkIDAttributeClient
{

    private $client;

    /**
     * Constructor
     */
    public function __construct($linkIDHost, $username, $password)
    {

        $wsdlLocation = "https://" . $linkIDHost . "/linkid-ws-username/attrib?wsdl";

        // need to enable trace to parse the soap response manually using simplexml
        // this is due to some out of spec xml attributes we are setting for specifying the attributeId
        $options = Array(
            "trace" => 1
        );

        $this->client = new LinkIDWSSoapClient($wsdlLocation, $options);
        $this->client->__setUsernameToken($username, $password, 'PasswordDigest');
    }

    public function getAttributes($userId, $attributeName = null)
    {

        $requestParams = null;
        if (null == $attributeName) {
            $requestParams = array(
                'Subject' => array(
                    'NameID' => $userId
                ),
            );
        } else {
            $requestParams = array(
                'Subject' => array(
                    'NameID' => $userId
                ),
                'Attribute' => array(
                    'Name' => $attributeName
                )
            );
        }

        /** @noinspection PhpUndefinedMethodInspection */
        $response = $this->client->attributeQuery($requestParams);
        // need to parse the raw xml string due to the custom linkID attributes for the attributeId
        $raw = $this->client->__getLastResponse();
        $xml = new SimpleXMLElement($raw);

        // validate response status
        $statusCode = $response->Status->StatusCode->Value;
        if ($statusCode != "urn:oasis:names:tc:SAML:2.0:status:Success") {

            $secondLevelStatusCode = $response->Status->StatusCode->StatusCode->Value;

            if ($secondLevelStatusCode == "urn:oasis:names:tc:SAML:2.0:status:InvalidAttrNameOrValue") {
                throw new Exception("Failed to get attributes: Attribute not found");
            } else if ($secondLevelStatusCode == "urn:oasis:names:tc:SAML:2.0:status:RequestDenied") {
                throw new Exception("Failed to get attributes: Request denied");
            } else if ($secondLevelStatusCode == "urn:net:lin-k:safe-online:SAML:2.0:status:AttributeUnavailable") {
                throw new Exception("Failed to get attributes: Attribute unavailable");
            } else if ($secondLevelStatusCode == "urn:oasis:names:tc:SAML:2.0:status:UnknownPrincipal") {
                throw new Exception("Failed to get attributes: Unknown principal");
            } else {
                throw new Exception("Failed to get attributes: Unexpected");
            }

        }

        // parse attributes
        $linkIDSaml2 = new LinkIDSaml2();
        $attributeStatement = $xml->children("http://schemas.xmlsoap.org/soap/envelope/")->Body[0]->children("urn:oasis:names:tc:SAML:2.0:protocol")->Response[0]->children("urn:oasis:names:tc:SAML:2.0:assertion")->Assertion[0]->AttributeStatement[0];
        return $linkIDSaml2->getAttributes($attributeStatement);
    }

}
