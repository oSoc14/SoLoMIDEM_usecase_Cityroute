<?php

require_once('LinkIDAuthnContext.php');
require_once('LinkIDAttribute.php');
require_once('LinkIDPaymentContext.php');

/*
 * LinkID SAML v2.0 Utility class
 *
 * @author Wim Vandenhaute
 */

class LinkIDSaml2
{

    public $expectedChallenge;
    public $expectedAudience;

    public function generateAuthnRequest($appName, $loginConfig, $loginPage, $clientAuthnMessage, $clientFinishedMessage, $identityProfiles, $attributeSuggestions, $paymentContext)
    {

        $this->expectedChallenge = $this->gen_uuid();
        $this->expectedAudience = $appName;

        // ACS is required but in WS case not applicable
        if (null == $loginPage) {
            $loginPage = "http://foo.bar";
        }

        $issueInstant = gmdate('Y-m-d\TH:i:s\Z');

        $authnRequest = "<saml2p:AuthnRequest xmlns:saml2p=\"urn:oasis:names:tc:SAML:2.0:protocol\" ";
        $authnRequest .= "AssertionConsumerServiceURL=\"" . $loginPage . "\" ";
        $authnRequest .= "Destination=\"" . $loginConfig->linkIDLandingPage . "\" ForceAuthn=\"false\" ";
        $authnRequest .= "ID=\"" . $this->expectedChallenge . "\" ";
        $authnRequest .= "IssueInstant=\"" . $issueInstant . "\" ";
        $authnRequest .= "ProtocolBinding=\"urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST\" Version=\"2.0\">";

        $authnRequest .= "<saml2:Issuer xmlns:saml2=\"urn:oasis:names:tc:SAML:2.0:assertion\">" . $appName . "</saml2:Issuer>";

        $authnRequest .= "<saml2p:NameIDPolicy AllowCreate=\"true\"/>";

        $authnRequest .= "<saml2p:Extensions>";

        /*
         * Optional linkID client messages / identity profiles
         */
        if (null != $clientAuthnMessage || null != $clientFinishedMessage || null != $identityProfiles) {

            $authnRequest .= "<saml2:DeviceContext xmlns:saml2=\"urn:oasis:names:tc:SAML:2.0:assertion\">";

            if (null != $clientAuthnMessage) {
                $authnRequest .= "<saml2:Attribute Name=\"linkID.authenticationMessage\">";

                $authnRequest .= "<saml2:AttributeValue xmlns:xs=\"http://www.w3.org/2001/XMLSchema\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:type=\"xs:string\">";
                $authnRequest .= $clientAuthnMessage;
                $authnRequest .= "</saml2:AttributeValue>";

                $authnRequest .= "</saml2:Attribute>";
            }
            if (null != $clientFinishedMessage) {
                $authnRequest .= "<saml2:Attribute Name=\"linkID.finishedMessage\">";

                $authnRequest .= "<saml2:AttributeValue xmlns:xs=\"http://www.w3.org/2001/XMLSchema\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:type=\"xs:string\">";
                $authnRequest .= $clientFinishedMessage;
                $authnRequest .= "</saml2:AttributeValue>";

                $authnRequest .= "</saml2:Attribute>";
            }

            if (null != $identityProfiles) {

                $i = 0;
                foreach ($identityProfiles as $identityProfile) {
                    $authnRequest .= "<saml2:Attribute Name=\"linkID.identityProfile." . $i . "\">";

                    $authnRequest .= "<saml2:AttributeValue xmlns:xs=\"http://www.w3.org/2001/XMLSchema\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:type=\"xs:string\">";
                    $authnRequest .= $identityProfile;
                    $authnRequest .= "</saml2:AttributeValue>";

                    $authnRequest .= "</saml2:Attribute>";

                    $i++;
                }
            }

            $authnRequest .= "</saml2:DeviceContext>";

        }

        /*
         * Optional linkID attribute suggestions
         */
        if (null != $attributeSuggestions) {

            $authnRequest .= "<saml2:SubjectAttributes xmlns:saml2=\"urn:oasis:names:tc:SAML:2.0:assertion\">";

            foreach ($attributeSuggestions as $key => $value) {

                // determine type
                $type = gettype($value);
                $xsType = "xs:string";
                $xsValue = $value;

                if ($type == "boolean") {
                    $xsType = "xs:boolean";
                } else if ($type == "integer") {
                    $xsType = "xs:integer";
                } else if ($type == "double") {
                    $xsType = "xs:float";
                } else if ($type == "string") {
                    $xsType = "xs:string";
                } else if ($type == "object" && $value instanceof DateTime) {
                    $xsType = "xs:dateTime";
                    $xsValue = $value->format(DateTime::ATOM);
                } else {
                    continue;
                }


                $authnRequest .= "<saml2:Attribute Name=\"" . $key . "\">";
                $authnRequest .= "<saml2:AttributeValue xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xs=\"http://www.w3.org/2001/XMLSchema\" xsi:type=\"" . $xsType . "\">" . $xsValue . "</saml2:AttributeValue>";
                $authnRequest .= "</saml2:Attribute>";

            }

            $authnRequest .= "</saml2:SubjectAttributes>";
        }

        /**
         * Optional payment context
         */
        if (null != $paymentContext) {

            $authnRequest .= "<saml2:PaymentContext xmlns:saml2=\"urn:oasis:names:tc:SAML:2.0:assertion\">";

            $authnRequest .= "<saml2:Attribute Name=\"PaymentContext.amount\">";
            $authnRequest .= "<saml2:AttributeValue xmlns:xs=\"http://www.w3.org/2001/XMLSchema\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:type=\"xs:string\">" . $paymentContext->amount . "</saml2:AttributeValue>";
            $authnRequest .= "</saml2:Attribute>";

            $authnRequest .= "<saml2:Attribute Name=\"PaymentContext.currency\">";
            $authnRequest .= "<saml2:AttributeValue xmlns:xs=\"http://www.w3.org/2001/XMLSchema\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:type=\"xs:string\">EUR</saml2:AttributeValue>";
            $authnRequest .= "</saml2:Attribute>";

            $authnRequest .= "<saml2:Attribute Name=\"PaymentContext.description\">";
            $authnRequest .= "<saml2:AttributeValue xmlns:xs=\"http://www.w3.org/2001/XMLSchema\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:type=\"xs:string\">" . $paymentContext->description . "</saml2:AttributeValue>";
            $authnRequest .= "</saml2:Attribute>";

            if (null != $paymentContext->orderReference) {
                $authnRequest .= "<saml2:Attribute Name=\"PaymentContext.orderReference\">";
                $authnRequest .= "<saml2:AttributeValue xmlns:xs=\"http://www.w3.org/2001/XMLSchema\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:type=\"xs:string\">" . $paymentContext->orderReference . "</saml2:AttributeValue>";
                $authnRequest .= "</saml2:Attribute>";
            }

            $authnRequest .= "<saml2:Attribute Name=\"PaymentContext.validationTime\">";
            $authnRequest .= "<saml2:AttributeValue xmlns:xs=\"http://www.w3.org/2001/XMLSchema\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:type=\"xs:string\">" . $paymentContext->validationTime . "</saml2:AttributeValue>";
            $authnRequest .= "</saml2:Attribute>";

            $authnRequest .= "<saml2:Attribute Name=\"PaymentContext.addLinkKey\">";
            $authnRequest .= "<saml2:AttributeValue xmlns:xs=\"http://www.w3.org/2001/XMLSchema\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:type=\"xs:string\">" . ($paymentContext->showAddPaymentMethodLink ? "true" : "false") . "</saml2:AttributeValue>";
            $authnRequest .= "</saml2:Attribute>";

            $authnRequest .= "<saml2:Attribute Name=\"PaymentContext.deferredPay\">";
            $authnRequest .= "<saml2:AttributeValue xmlns:xs=\"http://www.w3.org/2001/XMLSchema\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:type=\"xs:string\">" . ($paymentContext->allowDeferredPay ? "true" : "false") . "</saml2:AttributeValue>";
            $authnRequest .= "</saml2:Attribute>";

            $authnRequest .= "<saml2:Attribute Name=\"PaymentContext.mandate\">";
            $authnRequest .= "<saml2:AttributeValue xmlns:xs=\"http://www.w3.org/2001/XMLSchema\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:type=\"xs:string\">" . ($paymentContext->mandate ? "true" : "false") . "</saml2:AttributeValue>";
            $authnRequest .= "</saml2:Attribute>";

            if (null != $paymentContext->mandateDescription) {
                $authnRequest .= "<saml2:Attribute Name=\"PaymentContext.mandateDescription\">";
                $authnRequest .= "<saml2:AttributeValue xmlns:xs=\"http://www.w3.org/2001/XMLSchema\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:type=\"xs:string\">" . $paymentContext->mandateDescription . "</saml2:AttributeValue>";
                $authnRequest .= "</saml2:Attribute>";
            }
            if (null != $paymentContext->mandateReference) {
                $authnRequest .= "<saml2:Attribute Name=\"PaymentContext.mandateReference\">";
                $authnRequest .= "<saml2:AttributeValue xmlns:xs=\"http://www.w3.org/2001/XMLSchema\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:type=\"xs:string\">" . $paymentContext->mandateReference . "</saml2:AttributeValue>";
                $authnRequest .= "</saml2:Attribute>";
            }

            $authnRequest .= "</saml2:PaymentContext>";
        }

        $authnRequest .= "</saml2p:Extensions>";

        $authnRequest .= "</saml2p:AuthnRequest>";

        return $authnRequest;
    }

    public function parseAuthnResponse($authnResponse)
    {

        $xml = new SimpleXMLElement($authnResponse);
        return $this->parseXmlAuthnResponse($xml);
    }

    public function parseXmlAuthnResponse($xmlAuthnResponse)
    {

        // validate challenge
        $inResponseTo = $xmlAuthnResponse->attributes()->InResponseTo;
        if ($inResponseTo != $this->expectedChallenge) {
            throw new Exception("SAML response is not a response belonging to the original request.");
        }

        // check status success
        $statusValue = $xmlAuthnResponse->children("urn:oasis:names:tc:SAML:2.0:protocol")->Status[0]->StatusCode[0]->attributes()->Value;
        if ($statusValue != "urn:oasis:names:tc:SAML:2.0:status:Success") {
            return null;
        }

        // get userId
        $userId = (string)$xmlAuthnResponse->children("urn:oasis:names:tc:SAML:2.0:assertion")->Assertion[0]->Subject[0]->NameID[0];

        // check audience
        $audience = (string)$xmlAuthnResponse->children("urn:oasis:names:tc:SAML:2.0:assertion")->Assertion[0]->Conditions[0]->AudienceRestriction[0]->Audience[0];
        if ($audience != $this->expectedAudience) {
            throw new Exception("Audience name not correct, expected: " . $this->expectedAudience);
        }

        // validate NotBefore/NotOnOrAfter conditions
        $notBeforeString = (string)$xmlAuthnResponse->children("urn:oasis:names:tc:SAML:2.0:assertion")->Assertion[0]->Conditions[0]->attributes()->NotBefore;
        $notOnOrAfterString = (string)$xmlAuthnResponse->children("urn:oasis:names:tc:SAML:2.0:assertion")->Assertion[0]->Conditions[0]->attributes()->NotOnOrAfter;
        $this->checkConditionsTime($notBeforeString, $notOnOrAfterString);

        // parse attributes;
        $attributes = $this->getAttributes($xmlAuthnResponse->children("urn:oasis:names:tc:SAML:2.0:assertion")->Assertion[0]->AttributeStatement[0]);

        // parse payment response if any
        $extensions = $xmlAuthnResponse->children("urn:oasis:names:tc:SAML:2.0:protocol")->Extensions[0];
        $paymentResponse = null;
        if (null != $extensions) {
            $paymentResponse = $this->getPaymentResponse($extensions->children("urn:oasis:names:tc:SAML:2.0:assertion")->PaymentResponse[0]);
        }

        return new LinkIDAuthnContext($userId, $attributes, $paymentResponse);
    }

    public function getPaymentResponse($xmlPaymentResponse)
    {

        if (null == $xmlPaymentResponse) return null;

        $orderReference = null;
        $paymentState = null;
        $mandateReference = null;
        $docdataReference = null;
        foreach ($xmlPaymentResponse->Attribute as $xmlAttribute) {
            if ($xmlAttribute->attributes()->Name == "PaymentResponse.txnId") {
                $orderReference = (string)$xmlAttribute->AttributeValue[0];
            } else if ($xmlAttribute->attributes()->Name == "PaymentResponse.state") {
                $paymentState = (string)$xmlAttribute->AttributeValue[0];
            } else if ($xmlAttribute->attributes()->Name == "PaymentResponse.mandateRef") {
                $mandateReference = (string)$xmlAttribute->AttributeValue[0];
            } else if ($xmlAttribute->attributes()->Name == "PaymentResponse.docdataRef") {
                $docdataReference = (string)$xmlAttribute->AttributeValue[0];
            }
        }

        return new LinkIDPaymentResponse($orderReference, $paymentState, $mandateReference, $docdataReference);
    }

    public function getAttributes($attributeStatement)
    {

        $attributes = array();

        foreach ($attributeStatement->Attribute as $xmlAttribute) {

            $attribute = $this->getAttribute($xmlAttribute);

            $attributeList = array();
            if (array_key_exists($attribute->name, $attributes)) {
                $attributeList = $attributes[$attribute->name];
            }

            array_push($attributeList, $attribute);
            $attributes[$attribute->name] = $attributeList;
        }

        return $attributes;
    }

    public function getAttribute($xmlAttribute)
    {

        /** @noinspection PhpUndefinedMethodInspection */
        $name = (string)$xmlAttribute->attributes()->Name;
        /** @noinspection PhpUndefinedMethodInspection */
        $id = (string)$xmlAttribute->attributes("urn:net:lin-k:safe-online:saml")->attributeId;

        $value = null;
        if (isset($xmlAttribute->AttributeValue[0]->Attribute[0])) {

            // compound
            $value = array();
            foreach ($xmlAttribute->AttributeValue[0] as $xmlMemberAttribute) {

                /** @noinspection PhpUndefinedMethodInspection */
                $memberAttribute = new LinkIDAttribute($id, (string)$xmlMemberAttribute->attributes()->Name, $this->getAttributeValue($xmlMemberAttribute->AttributeValue[0]));
                array_push($value, $memberAttribute);

            }

        } else if (isset($xmlAttribute->AttributeValue[0]->AttributeValue[0])) {

            // ws compound
            $value = array();
            foreach ($xmlAttribute->AttributeValue[0] as $xmlMemberAttribute) {

                /** @noinspection PhpUndefinedMethodInspection */
                $memberAttribute = new LinkIDAttribute($id, (string)$xmlMemberAttribute->attributes()->Name, $this->getAttributeValue($xmlMemberAttribute->AttributeValue[0]));
                array_push($value, $memberAttribute);

            }

        } else {
            $value = $this->getAttributeValue($xmlAttribute->AttributeValue[0]);
        }

        return new LinkIDAttribute($id, $name, $value);
    }

    public function getAttributeValue($xmlAttributeValue)
    {

        date_default_timezone_set('UTC'); // needed for parsing dates

        /** @noinspection PhpUndefinedMethodInspection */
        $type = $xmlAttributeValue->attributes("http://www.w3.org/2001/XMLSchema-instance")->type;

        if ($type == "xs:string") {
            return (string)$xmlAttributeValue;
        } else if ($type == "xs:boolean") {
            return (boolean)$xmlAttributeValue;
        } else if ($type == "xs:integer" || $type == "xs:int") {
            return (integer)$xmlAttributeValue;
        } else if ($type == "xs:long") {
            return (float)$xmlAttributeValue;
        } else if ($type == "xs:float") {
            return (float)$xmlAttributeValue;
        } else if ($type == "xs:dateTime") {
            return new DateTime((string)$xmlAttributeValue);
        }

        return null;
    }

    public function checkConditionsTime($notBeforeString, $notOnOrAfterString)
    {

        $notBefore = new DateTime($notBeforeString);
        $notOnOrAfter = new DateTime($notOnOrAfterString);
        $now = new DateTime();

        if ($now <= $notBefore) {

            $now->add(new DateInterval('PT' . 5 . 'M'));
            if ($now < $notBefore) throw new Exception("SAML2 assertion invalid: invalid timeframe");
            $now->sub(new DateInterval('PT' . 10 . 'M'));
            if ($now > $notOnOrAfter) throw new Exception("SAML2 assertion invalid: invalid timeframe");

        } else {
            if ($now < $notBefore || $now > $notOnOrAfter) {
                throw new Exception("SAML2 assertion invalid: invalid timeframe");
            }
        }

    }

    public function gen_uuid()
    {
        return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            // 32 bits for "time_low"
            mt_rand(0, 0xffff), mt_rand(0, 0xffff),

            // 16 bits for "time_mid"
            mt_rand(0, 0xffff),

            // 16 bits for "time_hi_and_version",
            // four most significant bits holds version number 4
            mt_rand(0, 0x0fff) | 0x4000,

            // 16 bits, 8 bits for "clk_seq_hi_res",
            // 8 bits for "clk_seq_low",
            // two most significant bits holds zero and one for variant DCE1.1
            mt_rand(0, 0x3fff) | 0x8000,

            // 48 bits for "node"
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
        );
    }

}