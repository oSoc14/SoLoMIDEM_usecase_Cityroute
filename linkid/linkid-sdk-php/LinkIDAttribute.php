<?php

/*
 * LinkID Attribute
 *
 * @author Wim Vandenhaute
 */

class LinkIDAttribute
{

    public $id;
    public $name;

    /**
     * Value can be either a string, boolean, integer, float, unix timestamp or array of LinkIDAttribute objects for compound linkID attributes
     */
    public $value;

    /**
     * Constructor
     */
    public function __construct($id, $name, $value)
    {

        $this->id = $id;
        $this->name = $name;
        $this->value = $value;
    }

}
