"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase-browser";

type Tab = "employees" | "attendance" | "payroll";
type Employee = { id: string; first_name: string; last_name: string; role: string; department: string; pay_type: string; pay_rate: number; pay_cycle: string; status: string; phone: string; email: string; pin_code: string; leave_balance_vacation: number; leave_balance_sick: number; start_date: string; };
type Attendance = { id: string; employee_id: string; date: string; clock_in: string; clock_out: string; hours_worked: number; status: string; notes: string; source: string; employees?: { first_name: string; last_name: string } };

const supabase = createClient();
const fmt = (n: number) => n.toLocaleString("en-GY");
const today = () => new Date().toISOString().split("T")[0];

export default function PayrollDashboard() {
  const [tab, setTab] = useState<Tab>("employees");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [showAddAttendance, setShowAddAttendance] = useState(false);
  const [dateFrom, setDateFrom] = useState(() => { const d = new Date(); d.setDate(d.getDate() - 13); return d.toISOString().split("T")[0]; });
  const [dateTo, setDateTo] = useState(today());
  const [payrollCycle, setPayrollCycle] = useState<"fortnightly" | "monthly">("fortnightly");

  // New employee form
  const [newEmp, setNewEmp] = useState({ first_name: "", last_name: "", phone: "", email: "", role: "Technician", department: "Operations", pay_type: "hourly" as string, pay_rate: "", pay_cycle: "fortnightly" as string, pin_code: "" });

  // New attendance form
  const [newAtt, setNewAtt] = useState({ employee_id: "", date: today(), clock_in: "08:00", clock_out: "17:00", status: "present", notes: "" });

  const fetchEmployees = useCallback(async () => {
    const { data } = await supabase.from("employees").select("*").eq("status", "active").order("first_name");
    if (data) setEmployees(data);
  }, []);

  const fetchAttendance = useCallback(async () => {
    const { data } = await supabase.from("attendance").select("*, employees(first_name, last_name)").gte("date", dateFrom).lte("date", dateTo).order("date", { ascending: false });
    if (data) setAttendance(data as Attendance[]);
  }, [dateFrom, dateTo]);

  useEffect(() => { setLoading(true); Promise.all([fetchEmployees(), fetchAttendance()]).then(() => setLoading(false)); }, [fetchEmployees, fetchAttendance]);

  async function addEmployee() {
    if (!newEmp.first_name || !newEmp.last_name || !newEmp.pay_rate) return;
    const pin = newEmp.pin_code || String(Math.floor(1000 + Math.random() * 9000));
    await supabase.from("employees").insert({ ...newEmp, pay_rate: parseFloat(newEmp.pay_rate), pin_code: pin, start_date: today() });
    setNewEmp({ first_name: "", last_name: "", phone: "", email: "", role: "Technician", department: "Operations", pay_type: "hourly", pay_rate: "", pay_cycle: "fortnightly", pin_code: "" });
    setShowAddEmployee(false);
    fetchEmployees();
  }

  async function addAttendance() {
    if (!newAtt.employee_id || !newAtt.date) return;
    const clockIn = new Date(`${newAtt.date}T${newAtt.clock_in}:00-04:00`).toISOString();
    const clockOut = new Date(`${newAtt.date}T${newAtt.clock_out}:00-04:00`).toISOString();
    await supabase.from("attendance").insert({ employee_id: newAtt.employee_id, date: newAtt.date, clock_in: clockIn, clock_out: clockOut, status: newAtt.status, notes: newAtt.notes, source: "manual" });
    setShowAddAttendance(false);
    fetchAttendance();
  }

  // Payroll calculation
  function calculatePayroll() {
    const filtered = employees.filter(e => e.pay_cycle === payrollCycle);
    return filtered.map(emp => {
      const empAttendance = attendance.filter(a => a.employee_id === emp.id && a.date >= dateFrom && a.date <= dateTo);
      const totalHours = empAttendance.reduce((sum, a) => sum + (a.hours_worked || 0), 0);
      const daysWorked = empAttendance.filter(a => a.status === "present" || a.status === "half_day" || a.status === "late").length;
      const daysAbsent = empAttendance.filter(a => a.status === "absent").length;

      let grossPay = 0;
      if (emp.pay_type === "hourly") {
        const regularHours = Math.min(totalHours, payrollCycle === "fortnightly" ? 80 : 176);
        const overtimeHours = Math.max(0, totalHours - regularHours);
        grossPay = (regularHours * emp.pay_rate) + (overtimeHours * emp.pay_rate * 1.5);
      } else {
        // Salary: full amount minus absent day deductions
        const workDaysInPeriod = payrollCycle === "fortnightly" ? 10 : 22;
        const dailyRate = emp.pay_rate / workDaysInPeriod;
        grossPay = emp.pay_rate - (daysAbsent * dailyRate);
      }

      return { employee: emp, totalHours: Math.round(totalHours * 100) / 100, daysWorked, daysAbsent, grossPay: Math.round(grossPay), netPay: Math.round(grossPay) };
    });
  }

  const s = (active: boolean) => ({ padding: "10px 20px", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 700 as const, fontSize: "0.88rem", fontFamily: "inherit", background: active ? "#D4654A" : "#1a1513", color: active ? "#fff" : "#8B7355", transition: "all 0.2s" });
  const input = { width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #2a2420", background: "#141210", color: "#F5F0EB", fontFamily: "inherit", fontSize: "0.9rem" };
  const label = { display: "block" as const, fontSize: "0.78rem", color: "#8B7355", fontWeight: 600, marginBottom: "4px" };

  if (loading) return <div style={{ paddingTop: 100, textAlign: "center", color: "#8B7355" }}>Loading payroll system...</div>;

  return (
    <div style={{ minHeight: "100vh", background: "#0C0A09", color: "#F5F0EB", fontFamily: "'Nunito', sans-serif" }}>
      {/* Header */}
      <div style={{ padding: "24px 24px 0", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h1 style={{ fontFamily: "'Bricolage Grotesque', serif", fontSize: "1.6rem", fontWeight: 800, marginBottom: "4px" }}>
              💼 Payroll & Attendance
            </h1>
            <p style={{ fontSize: "0.82rem", color: "#7A7068" }}>Evolve Wireless — Staff Management</p>
          </div>
          <div style={{ fontSize: "0.82rem", color: "#8B7355", background: "#1a1513", padding: "8px 16px", borderRadius: "8px" }}>
            {employees.length} active staff
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "6px", marginBottom: "24px" }}>
          <button onClick={() => setTab("employees")} style={s(tab === "employees")}>👥 Employees</button>
          <button onClick={() => setTab("attendance")} style={s(tab === "attendance")}>📋 Attendance</button>
          <button onClick={() => setTab("payroll")} style={s(tab === "payroll")}>💰 Payroll</button>
        </div>
      </div>

      <div style={{ padding: "0 24px 48px", maxWidth: 1100, margin: "0 auto" }}>

        {/* ===== EMPLOYEES TAB ===== */}
        {tab === "employees" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ fontFamily: "'Bricolage Grotesque', serif", fontWeight: 700 }}>Staff Directory</h2>
              <button onClick={() => setShowAddEmployee(!showAddEmployee)} style={{ ...s(true), fontSize: "0.85rem" }}>+ Add Employee</button>
            </div>

            {showAddEmployee && (
              <div style={{ padding: "20px", borderRadius: "12px", background: "#141210", border: "1px solid #2a2420", marginBottom: "20px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div><label style={label}>First Name *</label><input value={newEmp.first_name} onChange={e => setNewEmp({ ...newEmp, first_name: e.target.value })} style={input} /></div>
                  <div><label style={label}>Last Name *</label><input value={newEmp.last_name} onChange={e => setNewEmp({ ...newEmp, last_name: e.target.value })} style={input} /></div>
                  <div><label style={label}>Phone</label><input value={newEmp.phone} onChange={e => setNewEmp({ ...newEmp, phone: e.target.value })} placeholder="+592..." style={input} /></div>
                  <div><label style={label}>Email</label><input value={newEmp.email} onChange={e => setNewEmp({ ...newEmp, email: e.target.value })} style={input} /></div>
                  <div><label style={label}>Role</label><input value={newEmp.role} onChange={e => setNewEmp({ ...newEmp, role: e.target.value })} style={input} /></div>
                  <div><label style={label}>Department</label>
                    <select value={newEmp.department} onChange={e => setNewEmp({ ...newEmp, department: e.target.value })} style={input}>
                      <option value="Operations">Operations</option><option value="Sales">Sales</option><option value="Technical">Technical</option><option value="Admin">Admin</option>
                    </select>
                  </div>
                  <div><label style={label}>Pay Type *</label>
                    <select value={newEmp.pay_type} onChange={e => setNewEmp({ ...newEmp, pay_type: e.target.value })} style={input}>
                      <option value="hourly">Hourly</option><option value="salary">Salary (fixed)</option>
                    </select>
                  </div>
                  <div><label style={label}>{newEmp.pay_type === "hourly" ? "Hourly Rate (GYD) *" : "Period Salary (GYD) *"}</label><input type="number" value={newEmp.pay_rate} onChange={e => setNewEmp({ ...newEmp, pay_rate: e.target.value })} style={input} /></div>
                  <div><label style={label}>Pay Cycle *</label>
                    <select value={newEmp.pay_cycle} onChange={e => setNewEmp({ ...newEmp, pay_cycle: e.target.value })} style={input}>
                      <option value="fortnightly">Fortnightly</option><option value="monthly">Monthly</option>
                    </select>
                  </div>
                  <div><label style={label}>PIN Code (4 digits, auto-generated if blank)</label><input value={newEmp.pin_code} onChange={e => setNewEmp({ ...newEmp, pin_code: e.target.value })} maxLength={4} placeholder="e.g. 1234" style={input} /></div>
                </div>
                <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                  <button onClick={addEmployee} style={{ ...s(true) }}>Save Employee</button>
                  <button onClick={() => setShowAddEmployee(false)} style={{ ...s(false) }}>Cancel</button>
                </div>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {employees.map(emp => (
                <div key={emp.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderRadius: "12px", background: "#141210", border: "1px solid #1e1a17", flexWrap: "wrap", gap: "12px" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{emp.first_name} {emp.last_name}</div>
                    <div style={{ fontSize: "0.78rem", color: "#7A7068" }}>{emp.role} · {emp.department} · PIN: {emp.pin_code}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 700, color: "#E9B44C", fontSize: "0.92rem" }}>
                      GYD {fmt(emp.pay_rate)}{emp.pay_type === "hourly" ? "/hr" : `/${emp.pay_cycle === "fortnightly" ? "fortnight" : "month"}`}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#7A7068" }}>{emp.pay_cycle} · 🏖️ {emp.leave_balance_vacation}d · 🤒 {emp.leave_balance_sick}d</div>
                  </div>
                </div>
              ))}
              {employees.length === 0 && <p style={{ color: "#7A7068", textAlign: "center", padding: "40px" }}>No employees added yet. Click &quot;+ Add Employee&quot; to start.</p>}
            </div>
          </>
        )}

        {/* ===== ATTENDANCE TAB ===== */}
        {tab === "attendance" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
              <h2 style={{ fontFamily: "'Bricolage Grotesque', serif", fontWeight: 700 }}>Attendance Records</h2>
              <button onClick={() => setShowAddAttendance(!showAddAttendance)} style={{ ...s(true), fontSize: "0.85rem" }}>+ Log Attendance</button>
            </div>

            {/* Date filter */}
            <div style={{ display: "flex", gap: "12px", marginBottom: "16px", alignItems: "center", flexWrap: "wrap" }}>
              <div><label style={label}>From</label><input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ ...input, width: "auto" }} /></div>
              <div><label style={label}>To</label><input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ ...input, width: "auto" }} /></div>
              <button onClick={fetchAttendance} style={{ ...s(true), marginTop: "16px", fontSize: "0.82rem" }}>Filter</button>
            </div>

            {showAddAttendance && (
              <div style={{ padding: "20px", borderRadius: "12px", background: "#141210", border: "1px solid #2a2420", marginBottom: "20px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                  <div><label style={label}>Employee *</label>
                    <select value={newAtt.employee_id} onChange={e => setNewAtt({ ...newAtt, employee_id: e.target.value })} style={input}>
                      <option value="">Select...</option>
                      {employees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
                    </select>
                  </div>
                  <div><label style={label}>Date *</label><input type="date" value={newAtt.date} onChange={e => setNewAtt({ ...newAtt, date: e.target.value })} style={input} /></div>
                  <div><label style={label}>Status</label>
                    <select value={newAtt.status} onChange={e => setNewAtt({ ...newAtt, status: e.target.value })} style={input}>
                      <option value="present">Present</option><option value="absent">Absent</option><option value="late">Late</option><option value="half_day">Half Day</option><option value="holiday">Holiday</option>
                    </select>
                  </div>
                  <div><label style={label}>Clock In</label><input type="time" value={newAtt.clock_in} onChange={e => setNewAtt({ ...newAtt, clock_in: e.target.value })} style={input} /></div>
                  <div><label style={label}>Clock Out</label><input type="time" value={newAtt.clock_out} onChange={e => setNewAtt({ ...newAtt, clock_out: e.target.value })} style={input} /></div>
                  <div><label style={label}>Notes</label><input value={newAtt.notes} onChange={e => setNewAtt({ ...newAtt, notes: e.target.value })} style={input} /></div>
                </div>
                <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                  <button onClick={addAttendance} style={{ ...s(true) }}>Save</button>
                  <button onClick={() => setShowAddAttendance(false)} style={{ ...s(false) }}>Cancel</button>
                </div>
              </div>
            )}

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #2a2420" }}>
                    {["Date", "Employee", "Clock In", "Clock Out", "Hours", "Status", "Source"].map(h => (
                      <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: "#7A7068", fontWeight: 600, fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {attendance.map(a => (
                    <tr key={a.id} style={{ borderBottom: "1px solid #1e1a17" }}>
                      <td style={{ padding: "10px 12px" }}>{a.date}</td>
                      <td style={{ padding: "10px 12px", fontWeight: 600 }}>{a.employees?.first_name} {a.employees?.last_name}</td>
                      <td style={{ padding: "10px 12px", color: "#8B7355" }}>{a.clock_in ? new Date(a.clock_in).toLocaleTimeString("en-GY", { hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                      <td style={{ padding: "10px 12px", color: "#8B7355" }}>{a.clock_out ? new Date(a.clock_out).toLocaleTimeString("en-GY", { hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                      <td style={{ padding: "10px 12px", fontWeight: 700, color: "#E9B44C" }}>{a.hours_worked ?? "—"}</td>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{ padding: "3px 10px", borderRadius: "100px", fontSize: "0.75rem", fontWeight: 600, background: a.status === "present" ? "rgba(76,175,80,0.1)" : a.status === "absent" ? "rgba(231,76,60,0.1)" : "rgba(233,180,76,0.1)", color: a.status === "present" ? "#4CAF50" : a.status === "absent" ? "#E74C3C" : "#E9B44C" }}>
                          {a.status}
                        </span>
                      </td>
                      <td style={{ padding: "10px 12px", fontSize: "0.78rem", color: "#7A7068" }}>{a.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {attendance.length === 0 && <p style={{ color: "#7A7068", textAlign: "center", padding: "40px" }}>No attendance records for this period.</p>}
            </div>
          </>
        )}

        {/* ===== PAYROLL TAB ===== */}
        {tab === "payroll" && (
          <>
            <h2 style={{ fontFamily: "'Bricolage Grotesque', serif", fontWeight: 700, marginBottom: "16px" }}>Payroll Calculator</h2>

            <div style={{ display: "flex", gap: "12px", marginBottom: "20px", alignItems: "end", flexWrap: "wrap" }}>
              <div><label style={label}>Period Start</label><input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ ...input, width: "auto" }} /></div>
              <div><label style={label}>Period End</label><input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ ...input, width: "auto" }} /></div>
              <div><label style={label}>Pay Cycle</label>
                <select value={payrollCycle} onChange={e => setPayrollCycle(e.target.value as "fortnightly" | "monthly")} style={{ ...input, width: "auto" }}>
                  <option value="fortnightly">Fortnightly</option><option value="monthly">Monthly</option>
                </select>
              </div>
              <button onClick={fetchAttendance} style={{ ...s(true), fontSize: "0.82rem" }}>Calculate</button>
            </div>

            {(() => {
              const payroll = calculatePayroll();
              const total = payroll.reduce((s, p) => s + p.netPay, 0);
              return (
                <>
                  {/* Summary Card */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "24px" }}>
                    <div style={{ padding: "20px", borderRadius: "12px", background: "#141210", border: "1px solid #1e1a17", textAlign: "center" }}>
                      <div style={{ fontSize: "0.75rem", color: "#7A7068", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>Staff</div>
                      <div style={{ fontFamily: "'Bricolage Grotesque', serif", fontSize: "1.8rem", fontWeight: 800 }}>{payroll.length}</div>
                    </div>
                    <div style={{ padding: "20px", borderRadius: "12px", background: "#141210", border: "1px solid #1e1a17", textAlign: "center" }}>
                      <div style={{ fontSize: "0.75rem", color: "#7A7068", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>Total Payroll</div>
                      <div style={{ fontFamily: "'Bricolage Grotesque', serif", fontSize: "1.8rem", fontWeight: 800, color: "#E9B44C" }}>GYD {fmt(total)}</div>
                    </div>
                    <div style={{ padding: "20px", borderRadius: "12px", background: "#141210", border: "1px solid #1e1a17", textAlign: "center" }}>
                      <div style={{ fontSize: "0.75rem", color: "#7A7068", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>Period</div>
                      <div style={{ fontSize: "0.92rem", fontWeight: 700 }}>{dateFrom} → {dateTo}</div>
                    </div>
                  </div>

                  {/* Payroll Table */}
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid #2a2420" }}>
                          {["Employee", "Type", "Hours", "Days Worked", "Absent", "Gross Pay", "Net Pay"].map(h => (
                            <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: "#7A7068", fontWeight: 600, fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {payroll.map(p => (
                          <tr key={p.employee.id} style={{ borderBottom: "1px solid #1e1a17" }}>
                            <td style={{ padding: "10px 12px", fontWeight: 600 }}>{p.employee.first_name} {p.employee.last_name}</td>
                            <td style={{ padding: "10px 12px", color: "#8B7355" }}>{p.employee.pay_type === "hourly" ? `GYD ${fmt(p.employee.pay_rate)}/hr` : "Salary"}</td>
                            <td style={{ padding: "10px 12px" }}>{p.totalHours}h</td>
                            <td style={{ padding: "10px 12px" }}>{p.daysWorked}</td>
                            <td style={{ padding: "10px 12px", color: p.daysAbsent > 0 ? "#E74C3C" : "#7A7068" }}>{p.daysAbsent}</td>
                            <td style={{ padding: "10px 12px", fontWeight: 700 }}>GYD {fmt(p.grossPay)}</td>
                            <td style={{ padding: "10px 12px", fontWeight: 700, color: "#4CAF50" }}>GYD {fmt(p.netPay)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr style={{ borderTop: "2px solid #2a2420" }}>
                          <td colSpan={5} style={{ padding: "12px", fontWeight: 800, fontSize: "0.95rem" }}>TOTAL</td>
                          <td style={{ padding: "12px", fontWeight: 800, fontSize: "0.95rem" }}>GYD {fmt(total)}</td>
                          <td style={{ padding: "12px", fontWeight: 800, fontSize: "0.95rem", color: "#4CAF50" }}>GYD {fmt(total)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                  {payroll.length === 0 && <p style={{ color: "#7A7068", textAlign: "center", padding: "40px" }}>No {payrollCycle} employees found. Add employees first, then log attendance.</p>}
                </>
              );
            })()}
          </>
        )}
      </div>
    </div>
  );
}
