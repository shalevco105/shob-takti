import Header from '@/components/Header';
import CurrentStatus from '@/components/CurrentStatus';
import CleaningSchedule from '@/components/CleaningSchedule';
import OnCallTableReadOnly from '@/components/OnCallTableReadOnly';
import JusticeTable from '@/components/JusticeTable';

export default function Home() {
    return (
        <main className="container">
            <Header />

            {/* Top Grid: Status, Cleaning */}
            <div className="dashboard-grid">
                <div style={{ gridColumn: 'span 2' }}>
                    <CurrentStatus />
                </div>
                <div>
                    <CleaningSchedule />
                </div>
            </div>

            {/* Main Content Area */}
            <div className="main-content-grid">
                {/* Main Table Section */}
                <div className="card glass" style={{ overflow: 'hidden' }}>
                    <div style={{ padding: '1.5rem' }}>
                        <OnCallTableReadOnly />
                    </div>
                </div>

                {/* Side Justice Table */}
                <div style={{ height: '600px', position: 'sticky', top: '1.5rem' }}>
                    <JusticeTable />
                </div>
            </div>
        </main>
    );
}
