<?php

require_once('LinkIDWSSoapClient.php');

/**
 * SOAP WS Client for the linkID Data WS.
 */
class LinkIDDataWSSoapClient extends LinkIDWSSoapClient
{

    private $NS = 'urn:liberty:dst:2006-08:ref:safe-online';
    private $NS_SAML = 'urn:oasis:names:tc:SAML:2.0:assertion';
    private $NS_SOSAML = 'urn:net:lin-k:safe-online:saml';
    private $NS_XML = 'http://www.w3.org/2001/XMLSchema';
    private $NS_XMLI = 'http://www.w3.org/2001/XMLSchema-instance';

    private $attribute;

    public function __setAttribute($attribute)
    {

        $this->attribute = $attribute;
    }

    public function __doRequest($request, $location, $action, $version)
    {

        /**
         * Modify operation is constructed here
         */
        if ("urn:liberty:dst:2006-08:ref:Modify" == $action) {

            $dom = new DOMDocument('1.0');

            try {

                //loads the SOAP request to the Document
                $dom->loadXML($request);

            } catch (DOMException $e) {
                die('Parse error with code ' . $e->code);
            }

            $path = new DOMXPath($dom);

            // find ModifyItem element and fill in
            $modifyItemList = $path->query('//*[local-name()="ModifyItem"]');
            for ($i = 0; $i < $modifyItemList->length; $i++) {
                $modifyItem = $modifyItemList->item($i);

                $modifyItem->appendChild($dom->createElementNS($this->NS, 'Select', $this->attribute->name));

                $newData = $dom->createElementNS($this->NS, 'NewData');
                $modifyItem->appendChild($newData);

                $domAttribute = $dom->createElementNS($this->NS_SAML, 'saml:Attribute');
                $newData->appendChild($domAttribute);
                $domAttribute->setAttributeNS($this->NS_SOSAML, 'sosaml:attributeId', $this->attribute->id);
                $domAttribute->setAttribute('Name', $this->attribute->name);

                $domAttributeValue = $dom->createElementNS($this->NS_SAML, 'saml:AttributeValue');
                $domAttribute->appendChild($domAttributeValue);

                // check compound
                if (is_array($this->attribute->value)) {

                    $domAttributeValue->setAttributeNS($this->NS_XMLI, 'xsi:type', "saml:AttributeType");

                    foreach ($this->attribute->value as $member) {

                        $domMemberAttributeValue = $dom->createElementNS($this->NS_SAML, 'saml:AttributeValue');
                        $domAttributeValue->appendChild($domMemberAttributeValue);
                        $domMemberAttributeValue->setAttribute('Name', $member->name);
                        $domMemberAttributeValue->setAttributeNS($this->NS_XMLI, 'xsi:type', "saml:AttributeType");
                        $domMemberValue = $dom->createElementNS($this->NS_SAML, 'saml:AttributeValue');
                        $domMemberAttributeValue->appendChild($domMemberValue);
                        $domMemberValue->setAttributeNS($this->NS_XMLI, 'xsi:type', $this->__getValueType($member->value));
                        $domMemberValue->setAttribute('xmlns:xs', $this->NS_XML);
                        $domValue = $dom->createTextNode($this->__getValue($member->value));
                        $domMemberValue->appendChild($domValue);

                    }

                } else {

                    $domAttributeValue->setAttributeNS($this->NS_XMLI, 'xsi:type', "saml:AttributeType");
                    $domAttributeValue->setAttributeNS($this->NS_XMLI, 'xsi:type', $this->__getValueType($this->attribute->value));
                    $domAttributeValue->setAttribute('xmlns:xs', $this->NS_XML);
                    $domValue = $dom->createTextNode($this->__getValue($this->attribute->value));
                    $domAttributeValue->appendChild($domValue);
                }


            }

            //save the modified SOAP request
            $request = $dom->saveXML();

        }

        /**
         * Delete operation is constructed here
         */
        if ("urn:liberty:dst:2006-08:ref:Delete" == $action) {

            $dom = new DOMDocument('1.0');

            try {

                //loads the SOAP request to the Document
                $dom->loadXML($request);

            } catch (DOMException $e) {
                die('Parse error with code ' . $e->code);
            }

            $path = new DOMXPath($dom);

            // find ModifyItem element and fill in
            $deleteItemList = $path->query('//*[local-name()="DeleteItem"]');
            for ($i = 0; $i < $deleteItemList->length; $i++) {
                $deleteItem = $deleteItemList->item($i);

                $select = $dom->createElementNS($this->NS, 'Select', $this->attribute->name);
                $deleteItem->appendChild($select);
                $select->setAttributeNS($this->NS_SOSAML, 'sosaml:attributeId', $this->attribute->id);

            }

            //save the modified SOAP request
            $request = $dom->saveXML();

        }


        $result = parent::__doRequest($request, $location, $action, $version);
        return $result;
    }

    public function __getValueType($value)
    {

        if (is_string($value)) {
            return "xs:string";
        } else if (is_bool($value)) {
            return "xs:boolean";
        } else if (is_int($value)) {
            return "xs:integer";
        } else if (is_long($value)) {
            return "xs:long";
        } else if (is_float($value)) {
            return "xs:float";
        } else if ($value instanceof DateTime) {
            return "xs:dateTime";
        } else {
            return "xs:string";
        }
    }

    public function __getValue($value)
    {

        if ($value instanceof DateTime) {
            return $value->format(DateTime::ATOM);
        } else if (is_bool($value)) {
            return $value ? "true" : "false";
        } else {
            return $value;
        }

    }
}
