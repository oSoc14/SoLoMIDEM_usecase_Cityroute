<?php

require_once('LinkIDWSSoapClient.php');

/**
 * SOAP WS Client for the linkID IdMapping WS.
 */
class LinkIDIdMappingWSSoapClient extends LinkIDWSSoapClient
{

    private $NS_SAML = 'urn:oasis:names:tc:SAML:2.0:assertion';

    private $attributeName;
    private $identifier;

    public function __setAttributeName($attributeName)
    {

        $this->attributeName = $attributeName;
    }

    public function __setIdentifier($identifier)
    {

        $this->identifier = $identifier;
    }

    public function __doRequest($request, $location, $action, $version)
    {

        $dom = new DOMDocument('1.0');

        try {

            //loads the SOAP request to the Document
            $dom->loadXML($request);

        } catch (DOMException $e) {
            die('Parse error with code ' . $e->code);
        }

        $path = new DOMXPath($dom);

        $itemList = $path->query('//*[local-name()="LinkIDNameIDMappingRequest"]');
        for ($i = 0; $i < $itemList->length; $i++) {

            $requestItem = $itemList->item($i);
            /** @noinspection PhpUndefinedMethodInspection */
            $requestItem->setAttribute('AttributeType', $this->attributeName);

            $nameId = $dom->createElementNS($this->NS_SAML, 'NameID', $this->identifier);
            $requestItem->appendChild($nameId);

        }

        $itemList = $path->query('//*[local-name()="NameIDPolicy"]');
        for ($i = 0; $i < $itemList->length; $i++) {

            $nameIDPolicy = $itemList->item($i);
            /** @noinspection PhpUndefinedMethodInspection */
            $nameIDPolicy->setAttribute('Format', 'urn:oasis:names:tc:SAML:2.0:nameid-format:persistent');
            /** @noinspection PhpUndefinedMethodInspection */
            $nameIDPolicy->setAttribute('AllowCreate', 'true');
        }

        //save the modified SOAP request
        $request = $dom->saveXML();

        $result = parent::__doRequest($request, $location, $action, $version);
        return $result;
    }

}