"use client";

import Sidebar from "@/app/components/sidebar";
import TopBar from "@/app/components/topbar";
import Button from "@/app/components/button";
import React, { useState, useEffect } from "react";

export default function Billing() {
    const [plans, setPlans] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchPlans = async () => {
            setIsLoading(true);
            try {
                const response = await fetch('/api/plans', { method: 'GET' });
                const data = await response.json();
                if (response.ok) {
                    setPlans(data.data); // Ensure your API sends data in this structure
                } else {
                    console.error('Failed to fetch plans:', data.message);
                }
            } catch (error) {
                console.error('Error fetching plans:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPlans();
    }, []);

    const handleUpgradeClick = async (planId) => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/plans/upgrade/${planId}`, {
                method: 'POST'
            });
            const data = await response.json();
            if (response.ok) {
                console.log('Plan upgraded successfully:', data);
            } else {
                console.error('Failed to upgrade plan:', data.message);
            }
        } catch (error) {
            console.error('Error upgrading plan:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <section className="flex h-screen bg-gray-100">
            <Sidebar />
            <main className="flex-1 flex flex-col">
                <TopBar />
                <article className="flex-grow overflow-auto p-8">
                    <section>
                        <header className="mb-6">
                            <h1 className="text-2xl font-bold mb-4">Billing</h1>
                            <p className="text-gray-500">
                                You currently are on <strong className="text-gray-500">Free Version</strong> of Awayme
                            </p>
                        </header>

                        {/* Fixed width for cards and horizontal scrolling */}
                        <div className="flex overflow-x-auto py-4">
                            {plans.map(plan => (
                                <div key={plan._id} className="flex-shrink-0 bg-white shadow rounded-lg p-6 mr-4 last:mr-0" style={{ width: '240px',height: '550px' }}>
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-lg font-bold">{plan.name}</h2>
                                        {plan.current && (
                                            <div className="text-sm text-white py-1 px-3 bg-black rounded-full">
                                                Current Plan
                                            </div>
                                        )}
                                    </div>
                                    <ul className="space-y-4">
                                        {plan.features.map((feature, idx) => (
                                            <li key={idx} className="flex items-center gap-2 font-semibold">
                                                ✓ {feature}
                                            </li>
                                        ))}
                                    </ul>
                                    <footer className="mt-4">
                                        <Button
                                            buttonText="Upgrade Now"
                                            buttonClassName="rounded-md shadow-button hover:shadow-buttonHover bg-accent text-white w-full py-3"
                                            onClick={() => handleUpgradeClick(plan._id)}
                                            isLoading={isLoading}
                                        />
                                    </footer>
                                </div>
                            ))}
                        </div>
                    </section>
                </article>
            </main>
        </section>
    );
}
