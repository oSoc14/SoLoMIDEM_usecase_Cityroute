<?php

require_once('LinkIDWSSoapClient.php');
require_once('LinkIDAuthnSession.php');
require_once('LinkIDPollResponse.php');

/*
 * linkID Auth WS client
 *
 * @author Wim Vandenhaute
 */

class LinkIDAuthClient
{

    private $client;

    /**
     * Constructor
     */
    public function __construct($linkIDHost, $username, $password)
    {

        $wsdlLocation = "https://" . $linkIDHost . "/linkid-ws-username/auth?wsdl";

        $this->client = new LinkIDWSSoapClient($wsdlLocation);
        $this->client->__setUsernameToken($username, $password, 'PasswordDigest');

    }

    /**
     * @param object $authnRequest the SAML v2.0 authentication request
     * @param string $language optional language (default is en)
     * @param null $userAgent optional user agent string, for adding e.g. callback params to the QR code URL, android chrome URL needs to be http://linkidmauthurl/MAUTH/2/zUC8oA/eA==, ...
     * @param bool $forceRegistration
     * @return \LinkIDAuthnSession the linkID authentication session containing the QR code image, URL, sessionId and client authentication context
     * @throws Exception something went wrong...
     */
    public function start($authnRequest, $language = "en", $userAgent = null, $forceRegistration = false)
    {
        $requestParams = array(
            'any' => $authnRequest,
            'language' => $language,
            'userAgent' => $userAgent,
            'forceRegistration' => $forceRegistration
        );
        /** @noinspection PhpUndefinedMethodInspection */
        $response = $this->client->start($requestParams);

        if (null != $response->error) {
            throw new Exception('Error: ' . $response->error->error . " - " . $response->error->info);
        }

        $qrCodeImage = base64_decode($response->success->encodedQRCode);

        return new LinkIDAuthnSession($response->success->sessionId, $qrCodeImage, $response->success->encodedQRCode, $response->success->qrCodeURL, $response->success->authenticationContext);

    }

    /**
     * @param LinkIDSaml2 $saml2Util
     * @param $sessionId
     * @param string $language
     * @return LinkIDPollResponse
     * @throws Exception
     */
    public function poll($saml2Util, $sessionId, $language = "en")
    {

        $requestParams = array(
            'sessionId' => $sessionId,
            'language' => $language
        );
        /** @noinspection PhpUndefinedMethodInspection */
        $response = $this->client->poll($requestParams);

        if (null != $response->error) {
            throw new Exception('Error: ' . $response->error->error . " - " . $response->error->info);
        }

        $authenticationContext = null;
//        print_r($response->success);
        if (null != $response->success->any) {

            $xml = new SimpleXMLElement($response->success->any);

            $authnResponse = $xml->children("urn:oasis:names:tc:SAML:2.0:protocol")->Response[0];

            $authenticationContext = $saml2Util->parseXmlAuthnResponse($authnResponse);
        }

        return new LinkIDPollResponse($response->success->authenticationState, $response->success->paymentState, $response->success->paymentMenuURL, $authenticationContext);
    }

}
