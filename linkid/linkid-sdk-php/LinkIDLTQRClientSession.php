<?php

/*
 * LinkID LTQR Session
 *
 * @author Wim Vandenhaute
 */

class LinkIDLTQRClientSession
{

    public $orderReference;
    public $clientSessionId;
    public $userId;
    public $created;
    public $paymentState;

    const STARTED = 0; // payment is being processed
    const PAYED = 1; // completed
    const FAILED = 2; // payment has failed

    /**
     * Constructor
     */
    public function __construct($orderReference, $clientSessionId, $userId, $created, $paymentState)
    {

        $this->orderReference = $orderReference;
        $this->clientSessionId = $clientSessionId;
        $this->userId = $userId;
        $this->created = $created;
        $this->paymentState = parseLinkIDLTQRPaymentState($paymentState);
    }
}

function parseLinkIDLTQRPaymentState($paymentState)
{

    if ($paymentState == "STARTED") return LinkIDLTQRClientSession::STARTED;
    if ($paymentState == "AUTHORIZED") return LinkIDLTQRClientSession::PAYED;
    if ($paymentState == "FAILED") return LinkIDLTQRClientSession::FAILED;

    throw new Exception("Unexpected payment state: " . $paymentState);
}