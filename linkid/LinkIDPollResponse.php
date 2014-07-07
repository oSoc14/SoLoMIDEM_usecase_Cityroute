<?php

class LinkIDPollResponse
{

    public $authenticationState;
    public $paymentState;
    public $paymentMenuURL;
    public $authenticationContext;

    // authentication state constants
    const AUTH_STATE_STARTED = 0;
    const AUTH_STATE_RETRIEVED = 1;
    const AUTH_STATE_AUTHENTICATED = 2;
    const AUTH_STATE_EXPIRED = 3;
    const AUTH_STATE_FAILED = 4;
    const AUTH_STATE_PAYMENT_ADD = 5;

    /**
     * Constructor
     */
    public function __construct($authenticationState, $paymentState, $paymentMenuURL, $authenticationContext)
    {

        $this->authenticationState = parseLinkIDAuthenticationState($authenticationState);
        $this->paymentState = parseLinkIDWSPaymentState($paymentState);
        $this->paymentMenuURL = $paymentMenuURL;
        $this->authenticationContext = $authenticationContext;
    }
}

function parseLinkIDAuthenticationState($authenticationState)
{

    if (null == $authenticationState) return null;

    if ($authenticationState == "linkid.state.started") {
        return LinkIDPollResponse::AUTH_STATE_STARTED;
    } else if ($authenticationState == "linkid.state.retrieved") {
        return LinkIDPollResponse::AUTH_STATE_RETRIEVED;
    } else if ($authenticationState == "linkid.state.authenticated") {
        return LinkIDPollResponse::AUTH_STATE_AUTHENTICATED;
    } else if ($authenticationState == "linkid.state.expired") {
        return LinkIDPollResponse::AUTH_STATE_EXPIRED;
    } else if ($authenticationState == "linkid.state.failed") {
        return LinkIDPollResponse::AUTH_STATE_FAILED;
    } else if ($authenticationState == "linkid.state.payment.add") {
        return LinkIDPollResponse::AUTH_STATE_PAYMENT_ADD;
    }

    throw new Exception("Unexpected authentication state: " . $authenticationState);

}

function parseLinkIDWSPaymentState($paymentState)
{

    if (null == $paymentState) return null;

    if ($paymentState == "linkid.payment.state.started") {
        return LinkIDPaymentResponse::STARTED;
    } else if ($paymentState == "linkid.payment.state.deferred") {
        return LinkIDPaymentResponse::DEFERRED;
    } else if ($paymentState == "linkid.payment.state.waiting") {
        return LinkIDPaymentResponse::WAITING_FOR_UPDATE;
    } else if ($paymentState == "linkid.payment.state.failed") {
        return LinkIDPaymentResponse::FAILED;
    } else if ($paymentState == "linkid.payment.state.refunded") {
        return LinkIDPaymentResponse::REFUNDED;
    } else if ($paymentState == "linkid.payment.state.refund_started") {
        return LinkIDPaymentResponse::REFUND_STARTED;
    } else if ($paymentState == "linkid.payment.state.payed") {
        return LinkIDPaymentResponse::PAYED;
    }

    throw new Exception("Unexpected payment state: " . $paymentState);

}
