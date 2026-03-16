// E2E API Testing Script for CRM System
const baseUrl = 'http://localhost:3000';

// Helper to make requests
async function request(method, path, body = null, cookie = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        }
    };

    if (cookie) {
        options.headers['Cookie'] = cookie;
    }

    if (body) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(`${baseUrl}${path}`, options);
    const setCookie = response.headers.get('set-cookie');
    const data = await response.json().catch(() => ({}));

    return {
        status: response.status,
        data,
        cookie: setCookie || cookie
    };
}

// Test Results
const results = {
    passed: [],
    failed: [],
    warnings: []
};

function log(phase, test, status, message) {
    const entry = `[${phase}] ${test}: ${status} - ${message}`;
    console.log(entry);
    if (status === 'PASS') results.passed.push(entry);
    else if (status === 'FAIL') results.failed.push(entry);
    else results.warnings.push(entry);
}

async function runTests() {
    console.log('='.repeat(80));
    console.log('STARTING E2E API TESTS');
    console.log('='.repeat(80));

    let adminCookie, employeeCookie, studentCookie;

    // PHASE 1: Authentication & RBAC
    console.log('\n📋 PHASE 1: Authentication & RBAC');

    // Test 1.1: Admin Login
    const adminLogin = await request('POST', '/api/auth/login', {
        email: 'admin@promptix.com',
        password: 'admin123'
    });

    if (adminLogin.status === 200 && adminLogin.cookie) {
        adminCookie = adminLogin.cookie;
        log('Phase 1', 'Admin Login', 'PASS', 'Successfully logged in as admin');
    } else {
        log('Phase 1', 'Admin Login', 'FAIL', `Status: ${adminLogin.status}`);
    }

    // Test 1.2: Employee Login
    const employeeLogin = await request('POST', '/api/auth/login', {
        email: 'empolyee2@gamil.com',
        password: 'password123'
    });

    if (employeeLogin.status === 200 && employeeLogin.cookie) {
        employeeCookie = employeeLogin.cookie;
        log('Phase 1', 'Employee Login', 'PASS', 'Successfully logged in as employee');
    } else {
        log('Phase 1', 'Employee Login', 'FAIL', `Status: ${employeeLogin.status}`);
    } else {
        log('Phase 1', 'Student Login', 'FAIL', `Status: ${studentLogin.status}`);
    } else {
        log('Phase 1', 'RBAC Protection', 'FAIL', `Student accessed admin API with status: ${rbacTest.status}`);
    }

    // Test 1.5: Logout
    const logout = await request('POST', '/api/auth/logout', null, adminCookie);
    if (logout.status === 200) {
        log('Phase 1', 'Logout API', 'PASS', 'Logout endpoint working');
    } else {
        log('Phase 1', 'Logout API', 'FAIL', `Status: ${logout.status}`);
    }
    // PHASE 3: User Management
    console.log('\n📋 PHASE 3: User Management');

    // Test 3.1: Admin can fetch users
    const users = await request('GET', '/api/admin/users', null, adminCookie);
    if (users.status === 200 && users.data.users) {
        log('Phase 3', 'Fetch Users', 'PASS', `Retrieved ${users.data.users.length} users`);
    } else {
        log('Phase 3', 'Fetch Users', 'FAIL', `Status: ${users.status}`);
    }

    // PHASE 4: Attendance
    console.log('\n📋 PHASE 4: Attendance');

    // Test 4.1: Employee Check-in
    const checkin = await request('POST', '/api/employee/attendance', {
        action: 'checkin'
    }, employeeCookie);

    if (checkin.status === 200 || checkin.status === 400) {
        log('Phase 4', 'Employee Check-in', checkin.status === 200 ? 'PASS' : 'INFO',
            checkin.status === 200 ? 'Check-in successful' : 'Already checked in today');
    } else {
        log('Phase 4', 'Employee Check-in', 'FAIL', `Status: ${checkin.status}`);
    }

    // Test 4.2: Admin fetch attendance
    const attendance = await request('GET', '/api/admin/attendance', null, adminCookie);
    if (attendance.status === 200) {
        log('Phase 4', 'Admin Fetch Attendance', 'PASS', 'Retrieved attendance records');
    } else {
        log('Phase 4', 'Admin Fetch Attendance', 'FAIL', `Status: ${attendance.status}`);
    }

    // PHASE 5: Leave Management
    console.log('\n📋 PHASE 5: Leave Management');

    // Test 5.1: Employee submit leave
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);

    const leave = await request('POST', '/api/employee/leaves', {
        fromDate: tomorrow.toISOString().split('T')[0],
        toDate: dayAfter.toISOString().split('T')[0],
        reason: 'E2E Test Leave Request'
    }, employeeCookie);

    if (leave.status === 200 || leave.status === 409) {
        log('Phase 5', 'Submit Leave', leave.status === 200 ? 'PASS' : 'INFO',
            leave.status === 200 ? 'Leave submitted' : 'Conflict detected (expected)');
    } else {
        log('Phase 5', 'Submit Leave', 'FAIL', `Status: ${leave.status}, Message: ${leave.data.message}`);
    }

    // Test 5.2: Admin fetch leaves
    const leaves = await request('GET', '/api/admin/leaves', null, adminCookie);
    if (leaves.status === 200) {
        log('Phase 5', 'Admin Fetch Leaves', 'PASS', 'Retrieved leave records');
    } else {
        log('Phase 5', 'Admin Fetch Leaves', 'FAIL', `Status: ${leaves.status}`);
    }

    // PHASE 6: Courses
    console.log('\n📋 PHASE 6: Courses');
    // PHASE 7: Events
    console.log('\n📋 PHASE 7: Events');

    // Test 7.1: Fetch events
    const events = await request('GET', '/api/events', null, studentCookie);
    if (events.status === 200) {
        log('Phase 7', 'Fetch Events', 'PASS', `Retrieved ${events.data.events?.length || 0} events`);
    } else {
        log('Phase 7', 'Fetch Events', 'FAIL', `Status: ${events.status}`);
    }

    // PHASE 8: Notifications
    console.log('\n📋 PHASE 8: Notifications');

    // Test 8.1: Fetch notifications
    const notifications = await request('GET', '/api/notifications', null, employeeCookie);
    if (notifications.status === 200) {
        const count = notifications.data.notifications?.length || 0;
        const unread = notifications.data.unreadCount || 0;
        log('Phase 8', 'Fetch Notifications', 'PASS', `Retrieved ${count} notifications (${unread} unread)`);
    } else {
        log('Phase 8', 'Fetch Notifications', 'FAIL', `Status: ${notifications.status}`);
    }

    // PHASE 9: Audit Logs
    console.log('\n📋 PHASE 9: Audit Logs');

    // Test 9.1: Admin fetch audit logs
    const auditLogs = await request('GET', '/api/admin/audit-logs', null, adminCookie);
    if (auditLogs.status === 200) {
        log('Phase 9', 'Fetch Audit Logs', 'PASS', `Retrieved ${auditLogs.data.logs?.length || 0} audit logs`);
    } else {
        log('Phase 9', 'Fetch Audit Logs', 'FAIL', `Status: ${auditLogs.status}`);
    }

    // Test 9.2: Employee cannot access audit logs
    const employeeAudit = await request('GET', '/api/admin/audit-logs', null, employeeCookie);
    if (employeeAudit.status === 401 || employeeAudit.status === 403) {
        log('Phase 9', 'Audit Log Protection', 'PASS', 'Employee correctly blocked from audit logs');
    } else {
        log('Phase 9', 'Audit Log Protection', 'FAIL', `Employee accessed audit logs with status: ${employeeAudit.status}`);
    }

    // PHASE 10: Analytics
    console.log('\n📋 PHASE 10: Analytics');

    // Test 10.1: Admin stats
    const adminStats = await request('GET', '/api/admin/stats', null, adminCookie);
    if (adminStats.status === 200) {
        log('Phase 10', 'Admin Analytics', 'PASS', `Stats: ${JSON.stringify(adminStats.data)}`);
    } else {
        log('Phase 10', 'Admin Analytics', 'FAIL', `Status: ${adminStats.status}`);
    }

    // Test 10.2: Employee stats
    const employeeStats = await request('GET', '/api/employee/stats', null, employeeCookie);
    if (employeeStats.status === 200) {
        log('Phase 10', 'Employee Analytics', 'PASS', 'Retrieved employee stats');
    } else {
        log('Phase 10', 'Employee Analytics', 'FAIL', `Status: ${employeeStats.status}`);
    }
    // SUMMARY
    console.log('\n' + '='.repeat(80));
    console.log('TEST SUMMARY');
    console.log('='.repeat(80));
    console.log(`✅ PASSED: ${results.passed.length}`);
    console.log(`❌ FAILED: ${results.failed.length}`);
    console.log(`⚠️  WARNINGS: ${results.warnings.length}`);

    if (results.failed.length > 0) {
        console.log('\n❌ FAILED TESTS:');
        results.failed.forEach(f => console.log(`  ${f}`));
    }

    if (results.warnings.length > 0) {
        console.log('\n⚠️  WARNINGS:');
        results.warnings.forEach(w => console.log(`  ${w}`));
    }

    console.log('\n✅ PASSED TESTS:');
    results.passed.forEach(p => console.log(`  ${p}`));

    console.log('\n' + '='.repeat(80));
    console.log(`OVERALL: ${results.failed.length === 0 ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    console.log('='.repeat(80));
}

// Run tests
runTests().catch(console.error);
