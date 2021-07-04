import React from 'react';
import { Navbar, Nav, Button } from 'react-bootstrap';

import logo from '../../images/webvotelogo.png';

import RegBtn from './registerBtnComponent';

function NavbarWVLogin() {
    return (
        <div className="shadow">
            <Navbar bg="light" expand="lg">
                <Navbar.Brand href="/">
                    <img src={logo} width="40" style={{ marginRight: "10px", marginLeft: "10px" }} alt="WebVote Logo" />
                    <label style={{ color: "#15784E", fontWeight: "bold", fontSize: "xx-large" }}>
                        <span style={{ color: "#2F4C58" }}>Web</span>
                        <span style={{ color: "#4999B8" }}>Vote</span>
                    </label>
                </Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="mr-auto navlinks offset-3">
                        <Nav.Link style={{ color: "#15784E", marginRight: "15px" }} href="/howto">How To?</Nav.Link>
                        <Nav.Link style={{ color: "#15784E", marginRight: "15px" }} href="/aboutus">About Us</Nav.Link>
                        <Nav.Link style={{ color: "#15784E", marginRight: "15px" }} href="/contactus">Contact Us</Nav.Link>
                    </Nav>
                    <RegBtn />
                    &nbsp; &nbsp; &nbsp;
                    <Nav>
                        <Button href="/" variant="outline-success"><span className="fas fa-sign-in-alt"></span> Login</Button>
                    </Nav>
                </Navbar.Collapse>
            </Navbar>
        </div>
    );
}

export default NavbarWVLogin;