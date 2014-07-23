<?php

require_once('LinkIDWSSoapClient.php');
require_once('LinkIDPaymentContext.php');
require_once('LinkIDLTQRSession.php');
require_once('LinkIDLTQRClientSession.php');

/*
 * linkID LTQR WS client
 *
 * @author Wim Vandenhaute
 */

class LinkIDLTQRClient
{

    private $client;

    /**
     * Constructor
     */
    public function __construct($linkIDHost, $username, $password)
    {

        $wsdlLocation = "https://" . $linkIDHost . "/linkid-ws-username/ltqr?wsdl";

        $this->client = new LinkIDWSSoapClient($wsdlLocation);
        $this->client->__setUsernameToken($username, $password, 'PasswordDigest');

    }

    /**
     * Push a long term QR session to linkID.
     *
     * paymentContext Optional payment context
     * oneTimeUse     Long term QR session can only be used once
     * expiryDate     Optional expiry date of the long term session.
     * expiryDuration Optional expiry duration of the long term session. Expressed in number of seconds starting from the creation.
     *                       Do not mix this attribute with expiryDate. If so, expiryDate will be preferred.
     *
     * Success object containing the QR in PNG format, the content of the QR code and a type 4 UUID session ID of the created long term session. This
     * session ID will be used in the notifications to the Service Provider.
     */
    public function push($paymentContext, $oneTimeUse = false, $expiryDate = null, $expiryDuration = null)
    {

        $requestParams = new stdClass;
        if (null != $paymentContext) {
            $requestParams->paymentContext = new stdClass;
            $requestParams->paymentContext->amount = $paymentContext->amount;
            $requestParams->paymentContext->currency = "EUR";
            $requestParams->paymentContext->description = $paymentContext->description;
            $requestParams->paymentContext->orderReference = $paymentContext->orderReference;
            $requestParams->paymentContext->paymentProfile = $paymentContext->profile;
            $requestParams->paymentContext->validationTime = $paymentContext->validationTime;
            $requestParams->paymentContext->allowDeferredPay = $paymentContext->allowDeferredPay;
        }

        $requestParams->oneTimeUse = $oneTimeUse;
        if (null != $expiryDate) {
            /** @noinspection PhpUndefinedMethodInspection */
            $requestParams->expiryDate = $expiryDate->format(DateTime::ATOM);
        }
        if (null != $expiryDuration) {
            $requestParams->expiryDuration = $expiryDuration;
        }

        /** @noinspection PhpUndefinedMethodInspection */
        $response = $this->client->push($requestParams);

        if (null != $response->error) {
            throw new Exception('Error: ' . $response->error->errorCode);
        }

        $qrCodeImage = base64_decode($response->success->encodedQR);

        return new LinkIDLTQRSession($qrCodeImage, $response->success->qrContent, $response->success->orderReference);
    }

    /**
     * Fetch a set of client sessions.
     *
     * orderReferences  Optional list of orderReferences to fetch. If none are specified, all LTQR sessions and client session are returned.
     * clientSessionIds optional list of client session IDs
     *
     * returns list of client sessions
     */
    public function pull($orderReferences = null, $clientSessionIds = null)
    {

        $requestParams = new stdClass;

        if (null != $orderReferences) {
            $requestParams->orderReferences = array();
            foreach ($orderReferences as $orderReference) {
                $requestParams->orderReferences[] = $orderReference;
            }
        }

        if (null != $clientSessionIds) {
            $requestParams->clientSessionIds = array();
            foreach ($clientSessionIds as $clientSessionId) {
                $requestParams->clientSessionIds[] = $clientSessionId;
            }
        }

        /** @noinspection PhpUndefinedMethodInspection */
        $response = $this->client->pull($requestParams);

        if (null != $response->error) {
            throw new Exception('Error: ' . $response->error->errorCode);
        }

        $clientSessions = array();
        foreach ($response->success as $session) {
            $clientSessions[] = new LinkIDLTQRClientSession($session->orderReference, $session->clientSessionId, $session->userId, $session->created, $session->paymentStatus);
        }

        return $clientSessions;
    }

    /**
     * Remove a set of client sessions.
     *
     * orderReferences  List of orderReferences to remove. If none are specified all related client sessions will be removed.
     * clientSessionIds optional list of client session IDs to remove
     */
    public function remove($orderReferences = null, $clientSessionIds = null)
    {

        $requestParams = new stdClass;

        if (null != $orderReferences) {
            $requestParams->orderReferences = array();
            foreach ($orderReferences as $orderReference) {
                $requestParams->orderReferences[] = $orderReference;
            }
        }

        if (null != $clientSessionIds) {
            $requestParams->clientSessionIds = array();
            foreach ($clientSessionIds as $clientSessionId) {
                $requestParams->clientSessionIds[] = $clientSessionId;
            }
        }

        /** @noinspection PhpUndefinedMethodInspection */
        $response = $this->client->remove($requestParams);

        if (null != $response->error) {
            throw new Exception('Error: ' . $response->error->errorCode);
        }

        // all good, return
        return;
    }
}