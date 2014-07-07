<?php

require_once('LinkIDWSSoapClient.php');
require_once('LinkIDPaymentContext.php');

/*
 * linkID Mandate WS client
 *
 * @author Wim Vandenhaute
 */

class LinkIDMandateClient
{

    private $client;

    /**
     * Constructor
     */
    public function __construct($linkIDHost, $username, $password)
    {

        $wsdlLocation = "https://" . $linkIDHost . "/linkid-ws-username/mandate?wsdl";

        $this->client = new LinkIDWSSoapClient($wsdlLocation);
        $this->client->__setUsernameToken($username, $password, 'PasswordDigest');

    }

    public function pay($mandateReference, $paymentContext, $language = "en")
    {

        $requestParams = new stdClass;

        $requestParams->paymentContext = new stdClass;
        $requestParams->paymentContext->amount = $paymentContext->amount;
        $requestParams->paymentContext->currency = "EUR";
        $requestParams->paymentContext->description = $paymentContext->description;
        $requestParams->paymentContext->orderReference = $paymentContext->orderReference;
        $requestParams->paymentContext->paymentProfile = $paymentContext->profile;

        $requestParams->mandateReference = $mandateReference;
        $requestParams->language = $language;

        /** @noinspection PhpUndefinedMethodInspection */
        $response = $this->client->pay($requestParams);

        if (null != $response->error) {
            throw new Exception('Error: ' . $response->error->errorCode);
        }

        return $response->success->orderReference;
    }
}