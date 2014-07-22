<?php

/*
 * LinkID Payment context
 *
 * @author Wim Vandenhaute
 */

class LinkIDPaymentContext
{

    public $amount;
    public $description;

    // optional order reference, if not specified linkID will generate one in UUID format
    public $orderReference;

    // optional payment profile
    public $profile;

    // maximum time to wait for payment validation, if not specified defaults to 5s
    public $validationTime;

    // whether or not to display a link to linkID's add payment method page if the linkID user does not have any payment methods added, default is true.
    public $showAddPaymentMethodLink;

    // whether or not deferred payments are allowed, if a user has no payment token attached to the linkID account
    // linkID can allow for the user to make a deferred payment which he can complete later on from his browser.
    public $allowDeferredPay;

    // mandates
    public $mandate;
    public $mandateDescription;
    public $mandateReference;

    /**
     * Constructor
     */
    public function __construct($amount, $description, $orderReference = null, $profile = null, $validationTime = 5, $showAddPaymentMethodLink = true, $allowDeferredPay = false,
                                $mandate = false, $mandateDescription = null, $mandateReference = null)
    {

        $this->amount = $amount;
        $this->description = $description;

        $this->orderReference = $orderReference;
        $this->profile = $profile;
        $this->validationTime = $validationTime;
        $this->showAddPaymentMethodLink = $showAddPaymentMethodLink;
        $this->allowDeferredPay = $allowDeferredPay;

        $this->mandate = $mandate;
        $this->mandateDescription = $mandateDescription;
        $this->mandateReference = $mandateReference;
    }
}