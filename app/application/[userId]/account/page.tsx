"use client";

import Sidebar from '@/app/components/sidebar';
import TopBar from '@/app/components/topbar';
import Input from '@/app/components/input'; // Use the Input component from Login/Register
import Button from '@/app/components/button'; // Use the Button component from Login/Register
import React, { useState } from 'react';

export default function Account() {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [error, setError] = useState({
        firstNameError: "",
        lastNameError: "",
        emailError: ""
    });
    const [isLoading, setIsLoading] = useState(false);

    const handleUpdate = () => {
        const isValid = validateFields();
        if (isValid) {
            const updatedAccountInfo = { firstName, lastName, email };
            console.log("Updated account info:", updatedAccountInfo);
        }
    };

    const handleCancel = () => {
        console.log("Changes cancelled");
    };

    function validateFields() {
        let isValid = true;
        if (!firstName) {
            setError((error) => ({ ...error, firstNameError: "First name is required" }));
            isValid = false;
        }
        if (!lastName) {
            setError((error) => ({ ...error, lastNameError: "Last name is required" }));
            isValid = false;
        }
        if (!email) {
            setError((error) => ({ ...error, emailError: "Email is required" }));
            isValid = false;
        } else if (!email.includes('@')) {
            setError((error) => ({ ...error, emailError: "Invalid email address" }));
            isValid = false;
        }
        return isValid;
    }

    return (
        <div className="flex h-screen bg-gray-100">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <TopBar />
                <div className="flex-grow overflow-auto p-8 flex">
                    <div className="w-1/2 rounded-lg p1 ml-0">
                        <h1 className="text-2xl font-bold mb-4">Account</h1>

                        <div className="flex gap-4 mb-1">
                            <div className="w-1/2">
                                <Input
                                    type="text"
                                    hasLabel
                                    label="First Name"
                                    value={firstName}
                                    placeholder="Enter your first name"
                                    onChange={(e) => setFirstName(e.target.value)}
                                    hasError={error.firstNameError !== ""}
                                    error={error.firstNameError}
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="w-1/2">
                                <Input
                                    type="text"
                                    hasLabel
                                    label="Last Name"
                                    value={lastName}
                                    placeholder="Enter your last name"
                                    onChange={(e) => setLastName(e.target.value)}
                                    hasError={error.lastNameError !== ""}
                                    error={error.lastNameError}
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <div className="w-full mb-4">
                            <Input
                                type="email"
                                hasLabel
                                label="Email"
                                value={email}
                                placeholder="Enter your email"
                                onChange={(e) => setEmail(e.target.value)}
                                hasError={error.emailError !== ""}
                                error={error.emailError}
                                disabled={isLoading}
                            />
                        </div>

                        <div className="flex justify-between">
                            <Button
                                buttonText="Cancel"
                                buttonClassName="rounded-md shadow-button hover:shadow-buttonHover bg-gray-300 text-black w-[250px] justify-center mx-auto"
                                onClick={handleCancel}
                                isDisabled={isLoading}
                            />
                            <Button
                                buttonText="Update"
                                buttonClassName="rounded-md shadow-button hover:shadow-buttonHover bg-accent text-white w-[250px] justify-center mx-auto ml-4"
                                onClick={handleUpdate}
                                isLoading={isLoading}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
