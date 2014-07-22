<?php

require_once('LinkIDPaymentResponse.php');
require_once('LinkIDAttribute.php');

/*
 * LinkID Authentication context
 *
 * @author Wim Vandenhaute
 */

class LinkIDAuthnContext
{

    public $userId;
    public $attributes;
    public $paymentResponse;

    /**
     * Constructor
     */
    public function __construct($userId, $attributes, $paymentResponse)
    {

        $this->userId = $userId;
        $this->attributes = $attributes;
        $this->paymentResponse = $paymentResponse;
    }
}
