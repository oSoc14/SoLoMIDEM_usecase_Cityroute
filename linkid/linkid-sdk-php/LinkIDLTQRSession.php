<?php

/*
 * LinkID LTQR Session
 *
 * @author Wim Vandenhaute
 */

class LinkIDLTQRSession
{

    public $qrCodeImage;
    public $qrCodeURL;
    public $orderReference;

    /**
     * Constructor
     */
    public function __construct($qrCodeImage, $qrCodeURL, $orderReference)
    {

        $this->qrCodeImage = $qrCodeImage;
        $this->qrCodeURL = $qrCodeURL;
        $this->orderReference = $orderReference;

    }
}