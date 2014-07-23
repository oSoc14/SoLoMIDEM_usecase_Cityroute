<?php

require_once('LinkIDWSSoapClient.php');
require_once('LinkIDPaymentResponse.php');

/*
 * linkID Payment WS client
 *
 * @author Wim Vandenhaute
 */

class LinkIDPaymentClient
{

    private $client;

    /**
     * Constructor
     */
    public function __construct($linkIDHost)
    {

        $wsdlLocation = "https://" . $linkIDHost . "/linkid-ws/payment?wsdl";

        $this->client = new SoapClient($wsdlLocation);
    }

    public function getStatus($orderReference)
    {

        $requestParams = array(
            'orderReference' => $orderReference
        );
        /** @noinspection PhpUndefinedMethodInspection */
        $response = $this->client->getStatus($requestParams);

        if (null == $response) throw new Exception("Failed to get payment status...");

        if (null == $response->paymentStatus) return LinkIDPaymentResponse::STARTED;

        return parseLinkIDPaymentState($response->paymentStatus);
    }

}