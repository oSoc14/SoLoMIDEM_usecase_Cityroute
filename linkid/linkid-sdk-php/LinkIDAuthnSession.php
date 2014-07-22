<?php

/*
 * LinkID LTQR Session
 *
 * @author Wim Vandenhaute
 */

class LinkIDAuthnSession
{

    public $sessionId;
    public $qrCodeImage;
    public $qrCodeImageEncoded;
    public $qrCodeURL;
    public $authenticationContext;

    /**
     * Constructor
     */
    public function __construct($sessionId, $qrCodeImage, $qrCodeImageEncoded, $qrCodeURL, $authenticationContext)
    {
        $this->sessionId = $sessionId;
        $this->qrCodeImage = $qrCodeImage;
        $this->qrCodeImageEncoded = $qrCodeImageEncoded;
        $this->qrCodeURL = $qrCodeURL;
        $this->authenticationContext = $authenticationContext;
    }
}
