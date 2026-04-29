"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import {
  User, Mail, Lock, Phone, MapPin,
  ChevronRight, ChevronLeft, Check,
  Calendar, Activity, ShieldCheck,
  AlertCircle, Loader2, Eye, EyeOff
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { format, subYears } from "date-fns";

const countries = [
  { name: "AFGHANISTAN", code: "+93", iso: "AF" }, { name: "ALBANIA", code: "+355", iso: "AL" }, { name: "ALGERIA", code: "+213", iso: "DZ" },
  { name: "ANDORRA", code: "+376", iso: "AD" }, { name: "ANGOLA", code: "+244", iso: "AO" }, { name: "ARGENTINA", code: "+54", iso: "AR" },
  { name: "ARMENIA", code: "+374", iso: "AM" }, { name: "AUSTRALIA", code: "+61", iso: "AU" }, { name: "AUSTRIA", code: "+43", iso: "AT" },
  { name: "AZERBAIJAN", code: "+994", iso: "AZ" }, { name: "BAHAMAS", code: "+1", iso: "BS" }, { name: "BAHRAIN", code: "+973", iso: "BH" },
  { name: "BANGLADESH", code: "+880", iso: "BD" }, { name: "BARBADOS", code: "+1", iso: "BB" }, { name: "BELARUS", code: "+375", iso: "BY" },
  { name: "BELGIUM", code: "+32", iso: "BE" }, { name: "BELIZE", code: "+501", iso: "BZ" }, { name: "BENIN", code: "+229", iso: "BJ" },
  { name: "BHUTAN", code: "+975", iso: "BT" }, { name: "BOLIVIA", code: "+591", iso: "BO" }, { name: "BOSNIA", code: "+387", iso: "BA" },
  { name: "BOTSWANA", code: "+267", iso: "BW" }, { name: "BRAZIL", code: "+55", iso: "BR" }, { name: "BRUNEI", code: "+673", iso: "BN" },
  { name: "BULGARIA", code: "+359", iso: "BG" }, { name: "BURKINA FASO", code: "+226", iso: "BF" }, { name: "BURUNDI", code: "+257", iso: "BI" },
  { name: "CAMBODIA", code: "+855", iso: "KH" }, { name: "CAMEROON", code: "+237", iso: "CM" }, { name: "CANADA", code: "+1", iso: "CA" },
  { name: "CAPE VERDE", code: "+238", iso: "CV" }, { name: "CENTRAL AFRICAN REP", code: "+236", iso: "CF" }, { name: "CHAD", code: "+235", iso: "TD" },
  { name: "CHILE", code: "+56", iso: "CL" }, { name: "CHINA", code: "+86", iso: "CN" }, { name: "COLOMBIA", code: "+57", iso: "CO" },
  { name: "COMOROS", code: "+269", iso: "KM" }, { name: "CONGO", code: "+242", iso: "CG" }, { name: "COSTA RICA", code: "+506", iso: "CR" },
  { name: "CROATIA", code: "+385", iso: "HR" }, { name: "CUBA", code: "+53", iso: "CU" }, { name: "CYPRUS", code: "+357", iso: "CY" },
  { name: "CZECH REPUBLIC", code: "+420", iso: "CZ" }, { name: "DENMARK", code: "+45", iso: "DK" }, { name: "DJIBOUTI", code: "+253", iso: "DJ" },
  { name: "DOMINICA", code: "+1", iso: "DM" }, { name: "DOMINICAN REP", code: "+1", iso: "DO" }, { name: "ECUADOR", code: "+593", iso: "EC" },
  { name: "EGYPT", code: "+20", iso: "EG" }, { name: "EL SALVADOR", code: "+503", iso: "SV" }, { name: "EQUATORIAL GUINEA", code: "+240", iso: "GQ" },
  { name: "ERITREA", code: "+291", iso: "ER" }, { name: "ESTONIA", code: "+372", iso: "EE" }, { name: "ETHIOPIA", code: "+251", iso: "ET" },
  { name: "FIJI", code: "+679", iso: "FJ" }, { name: "FINLAND", code: "+358", iso: "FI" }, { name: "FRANCE", code: "+33", iso: "FR" },
  { name: "GABON", code: "+241", iso: "GA" }, { name: "GAMBIA", code: "+220", iso: "GM" }, { name: "GEORGIA", code: "+995", iso: "GE" },
  { name: "GERMANY", code: "+49", iso: "DE" }, { name: "GHANA", code: "+233", iso: "GH" }, { name: "GREECE", code: "+30", iso: "GR" },
  { name: "GRENADA", code: "+1", iso: "GD" }, { name: "GUATEMALA", code: "+502", iso: "GT" }, { name: "GUINEA", code: "+224", iso: "GN" },
  { name: "GUYANA", code: "+592", iso: "GY" }, { name: "HAITI", code: "+509", iso: "HT" }, { name: "HONDURAS", code: "+504", iso: "HN" },
  { name: "HUNGARY", code: "+36", iso: "HU" }, { name: "ICELAND", code: "+354", iso: "IS" }, { name: "INDIA", code: "+91", iso: "IN" },
  { name: "INDONESIA", code: "+62", iso: "ID" }, { name: "IRAN", code: "+98", iso: "IR" }, { name: "IRAQ", code: "+964", iso: "IQ" },
  { name: "IRELAND", code: "+353", iso: "IE" }, { name: "ISRAEL", code: "+972", iso: "IL" }, { name: "ITALY", code: "+39", iso: "IT" },
  { name: "JAMAICA", code: "+1", iso: "JM" }, { name: "JAPAN", code: "+81", iso: "JP" }, { name: "JORDAN", code: "+962", iso: "JO" },
  { name: "KAZAKHSTAN", code: "+7", iso: "KZ" }, { name: "KENYA", code: "+254", iso: "KE" }, { name: "KIRIBATI", code: "+686", iso: "KI" },
  { name: "KUWAIT", code: "+965", iso: "KW" }, { name: "KYRGYZSTAN", code: "+996", iso: "KG" }, { name: "LAOS", code: "+856", iso: "LA" },
  { name: "LATVIA", code: "+371", iso: "LV" }, { name: "LEBANON", code: "+961", iso: "LB" }, { name: "LESOTHO", code: "+266", iso: "LS" },
  { name: "LIBERIA", code: "+231", iso: "LR" }, { name: "LIBYA", code: "+218", iso: "LY" }, { name: "LIECHTENSTEIN", code: "+423", iso: "LI" },
  { name: "LITHUANIA", code: "+370", iso: "LT" }, { name: "LUXEMBOURG", code: "+352", iso: "LU" }, { name: "MACEDONIA", code: "+389", iso: "MK" },
  { name: "MADAGASCAR", code: "+261", iso: "MG" }, { name: "MALAWI", code: "+265", iso: "MW" }, { name: "MALAYSIA", code: "+60", iso: "MY" },
  { name: "MALDIVES", code: "+960", iso: "MV" }, { name: "MALI", code: "+223", iso: "ML" }, { name: "MALTA", code: "+356", iso: "MT" },
  { name: "MARSHALL ISLANDS", code: "+692", iso: "MH" }, { name: "MAURITANIA", code: "+222", iso: "MR" }, { name: "MAURITIUS", code: "+230", iso: "MU" },
  { name: "MEXICO", code: "+52", iso: "MX" }, { name: "MICRONESIA", code: "+691", iso: "FM" }, { name: "MOLDOVA", code: "+373", iso: "MD" },
  { name: "MONACO", code: "+377", iso: "MC" }, { name: "MONGOLIA", code: "+976", iso: "MN" }, { name: "MONTENEGRO", code: "+382", iso: "ME" },
  { name: "MOROCCO", code: "+212", iso: "MA" }, { name: "MOZAMBIQUE", code: "+258", iso: "MZ" }, { name: "MYANMAR", code: "+95", iso: "MM" },
  { name: "NAMIBIA", code: "+264", iso: "NA" }, { name: "NAURU", code: "+674", iso: "NR" }, { name: "NEPAL", code: "+977", iso: "NP" },
  { name: "NETHERLANDS", code: "+31", iso: "NL" }, { name: "NEW ZEALAND", code: "+64", iso: "NZ" }, { name: "NICARAGUA", code: "+505", iso: "NI" },
  { name: "NIGER", code: "+227", iso: "NE" }, { name: "NIGERIA", code: "+234", iso: "NG" }, { name: "NORTH KOREA", code: "+850", iso: "KP" },
  { name: "NORWAY", code: "+47", iso: "NO" }, { name: "OMAN", code: "+968", iso: "OM" }, { name: "PAKISTAN", code: "+92", iso: "PK" },
  { name: "PALAU", code: "+680", iso: "PW" }, { name: "PANAMA", code: "+507", iso: "PA" }, { name: "PAPUA NEW GUINEA", code: "+675", iso: "PG" },
  { name: "PARAGUAY", code: "+595", iso: "PY" }, { name: "PERU", code: "+51", iso: "PE" }, { name: "PHILIPPINES", code: "+63", iso: "PH" },
  { name: "POLAND", code: "+48", iso: "PL" }, { name: "PORTUGAL", code: "+351", iso: "PT" }, { name: "QATAR", code: "+974", iso: "QA" },
  { name: "ROMANIA", code: "+40", iso: "RO" }, { name: "RUSSIA", code: "+7", iso: "RU" }, { name: "RWANDA", code: "+250", iso: "RW" },
  { name: "SAMOA", code: "+685", iso: "WS" }, { name: "SAN MARINO", code: "+378", iso: "SM" }, { name: "SAUDI ARABIA", code: "+966", iso: "SA" },
  { name: "SENEGAL", code: "+221", iso: "SN" }, { name: "SERBIA", code: "+381", iso: "RS" }, { name: "SEYCHELLES", code: "+248", iso: "SC" },
  { name: "SIERRA LEONE", code: "+232", iso: "SL" }, { name: "SINGAPORE", code: "+65", iso: "SG" }, { name: "SLOVAKIA", code: "+421", iso: "SK" },
  { name: "SLOVENIA", code: "+386", iso: "SI" }, { name: "SOLOMON ISLANDS", code: "+677", iso: "SB" }, { name: "SOMALIA", code: "+252", iso: "SO" },
  { name: "SOUTH AFRICA", code: "+27", iso: "ZA" }, { name: "SOUTH KOREA", code: "+82", iso: "KR" }, { name: "SPAIN", code: "+34", iso: "ES" },
  { name: "SRI LANKA", code: "+94", iso: "LK" }, { name: "SUDAN", code: "+249", iso: "SD" }, { name: "SURINAME", code: "+597", iso: "SR" },
  { name: "SWAZILAND", code: "+268", iso: "SZ" }, { name: "SWEDEN", code: "+46", iso: "SE" }, { name: "SWITZERLAND", code: "+41", iso: "CH" },
  { name: "SYRIA", code: "+963", iso: "SY" }, { name: "TAIWAN", code: "+886", iso: "TW" }, { name: "TAJIKISTAN", code: "+992", iso: "TJ" },
  { name: "TANZANIA", code: "+255", iso: "TZ" }, { name: "THAILAND", code: "+66", iso: "TH" }, { name: "TOGO", code: "+228", iso: "TG" },
  { name: "TONGA", code: "+676", iso: "TO" }, { name: "TRINIDAD & TOBAGO", code: "+1", iso: "TT" }, { name: "TUNISIA", code: "+216", iso: "TN" },
  { name: "TURKEY", code: "+90", iso: "TR" }, { name: "TURKMENISTAN", code: "+993", iso: "TM" }, { name: "TUVALU", code: "+688", iso: "TV" },
  { name: "UGANDA", code: "+256", iso: "UG" }, { name: "UKRAINE", code: "+380", iso: "UA" }, { name: "UNITED ARAB EMIRATES", code: "+971", iso: "AE" },
  { name: "UNITED KINGDOM", code: "+44", iso: "GB" }, { name: "UNITED STATES", code: "+1", iso: "US" }, { name: "URUGUAY", code: "+598", iso: "UY" },
  { name: "UZBEKISTAN", code: "+998", iso: "UZ" }, { name: "VANUATU", code: "+678", iso: "VU" }, { name: "VATICAN CITY", code: "+379", iso: "VA" },
  { name: "VENEZUELA", code: "+58", iso: "VE" }, { name: "VIETNAM", code: "+84", iso: "VN" }, { name: "YEMEN", code: "+967", iso: "YE" },
  { name: "ZAMBIA", code: "+260", iso: "ZM" }, { name: "ZIMBABWE", code: "+263", iso: "ZW" }
];

type Step = 1 | 2 | 3 | 4 | 5;

export default function RegisterPage() {
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [confirmedEmail, setConfirmedEmail] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: "WEAK", color: "#ef4444" });
  const [heightUnit, setHeightUnit] = useState<'cm' | 'ft'>('cm');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');
  const [ftValue, setFtValue] = useState({ feet: "", inches: "" });
  const [lbsValue, setLbsValue] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  // Registration Data
  const [formData, setFormData] = useState({
    // Step 1
    email: "",
    password: "",
    confirmPassword: "",
    // Step 3
    firstName: "",
    lastName: "",
    dob: "",
    username: "",
    // Step 4
    phone: "",
    countryCode: "+94",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    country: "SRILANKA",
    emergencyName: "",
    emergencyCountryCode: "+94",
    emergencyPhone: "",
    // Step 5
    height: "",
    weight: "",
    position: "",
    goals: "",
    medicalHistory: "",
    waiverAccepted: false
  });

  const { user, profile, loading: authLoading, refreshProfile, supabase } = useAuth();
  const router = useRouter();

  // Handle Input Changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (name === 'countryCode') {
      const selectedCountry = countries.find(c => c.code === value);
      setFormData(prev => ({
        ...prev,
        countryCode: value,
        country: selectedCountry ? selectedCountry.name : prev.country
      }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));

    if (errorMsg) setErrorMsg("");

    if (name === 'password') {
      calculateStrength(value);
    }
  };

  const calculateStrength = (pass: string) => {
    let score = 0;
    if (pass.length > 6) score++;
    if (pass.length > 10) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    let strength = { score: 0, label: "WEAK", color: "#ef4444" };
    if (score <= 2) strength = { score: 25, label: "WEAK", color: "#ef4444" };
    else if (score <= 4) strength = { score: 60, label: "MEDIUM", color: "#f97316" };
    else strength = { score: 100, label: "STRONG", color: "#22c55e" };

    if (pass.length === 0) strength = { score: 0, label: "EMPTY", color: "#333" };
    setPasswordStrength(strength);
  };

  const sanitizeInput = (val: string) => {
    return val.replace(/[<>&]/g, (tag) => ({
      '<': '&lt;',
      '>': '&gt;',
      '&': '&amp;'
    }[tag] || tag)).trim();
  };

  const validatePhase5Field = (name: string, value: string) => {
    const trimmed = value.trim();
    let error = "";

    if (name === 'position') {
      const positionRegex = /^[A-Za-z\s\-/]+$/;
      if (!trimmed) error = "Position is required";
      else if (trimmed.length < 2 || trimmed.length > 50) error = "Position must be between 2–50 characters";
      else if (!positionRegex.test(trimmed)) error = "Please enter a valid position (letters only)";
    }

    if (name === 'goals') {
      const goalsRegex = /^[A-Za-z\s,\-]+$/;
      if (!trimmed) error = "Please enter at least one goal";
      else if (trimmed.length < 2 || trimmed.length > 200) error = "Main goals must be between 2–200 characters";
      else if (!goalsRegex.test(trimmed)) error = "Goals can only contain letters, spaces, commas, and hyphens";
      else {
        const goalList = trimmed.split(',').map(g => g.trim()).filter(g => g !== "");
        if (goalList.length === 0) error = "Please enter at least one goal";
        else if (goalList.length > 10) error = "Maximum 10 goals allowed";
        else if (goalList.some(g => g.length < 2 || g.length > 50)) error = "Each goal must be between 2–50 characters";
      }
    }

    if (name === 'medicalHistory' && trimmed !== "") {
      const medicalRegex = /^[A-Za-z0-9\s,\.\-\(\)]+$/;
      if (trimmed.length < 5 || trimmed.length > 1000) error = "Medical history must be between 5–1000 characters";
      else if (!medicalRegex.test(trimmed)) error = "Medical history contains invalid characters";
    }

    setFieldErrors(prev => ({ ...prev, [name]: error }));
    return error === "";
  };

  const toggleHeightUnit = (unit: 'cm' | 'ft') => {
    if (unit === heightUnit) return;
    
    if (unit === 'ft' && formData.height) {
      const cm = Number(formData.height);
      const feet = Math.floor(cm / 30.48);
      const inches = Math.round((cm % 30.48) / 2.54);
      setFtValue({ feet: feet.toString(), inches: inches.toString() });
    } else if (unit === 'cm' && ftValue.feet) {
      const cm = (Number(ftValue.feet) * 30.48) + (Number(ftValue.inches) * 2.54);
      setFormData(prev => ({ ...prev, height: Math.round(cm).toString() }));
    }
    setHeightUnit(unit);
  };

  const toggleWeightUnit = (unit: 'kg' | 'lbs') => {
    if (unit === weightUnit) return;

    if (unit === 'lbs' && formData.weight) {
      const kg = Number(formData.weight);
      const lbs = Math.round(kg * 2.20462);
      setLbsValue(lbs.toString());
    } else if (unit === 'kg' && lbsValue) {
      const kg = Number(lbsValue) * 0.453592;
      setFormData(prev => ({ ...prev, weight: kg.toFixed(1) }));
    }
    setWeightUnit(unit);
  };

  // Step 1: Sign Up Logic
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setErrorMsg("Passwords do not match");
      return;
    }

    if (passwordStrength.label === "WEAK") {
      setErrorMsg("Password is too weak. Add more characters, numbers or symbols.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/api/auth/callback` : undefined;

    // Step 1: First check if user already exists (unconfirmed) via server-side admin API
    const checkRes = await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: formData.email, redirectTo }),
    });

    const checkData = await checkRes.json();
    console.log("Pre-check result:", checkRes.status, checkData);

    if (checkRes.status === 200 && checkData.status === "sent") {
      // User exists but was unconfirmed — fresh link sent via Admin API
      setStep(2);
      setSuccessMsg("Account already registered. A fresh verification link has been sent to your inbox.");
      setLoading(false);
      return;
    }

    if (checkRes.status === 200 && checkData.status === "already_confirmed") {
      // User is confirmed — show reset password option
      setConfirmedEmail(formData.email);
      setLoading(false);
      return;
    }

    // Step 2: User not found — proceed with normal signUp
    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        emailRedirectTo: redirectTo,
        data: {
          full_name: `${formData.firstName} ${formData.lastName}`.trim()
        }
      }
    });

    console.log("Supabase SignUp Response:", { data, error });

    if (error) {
      setErrorMsg(error.message);
    } else if (data?.user && (!data.user.identities || data.user.identities.length === 0)) {
      // Supabase silently "succeeded" but the user already existed
      // Fall back to server-side admin resend as a safety net
      const fallbackRes = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, redirectTo }),
      });
      const fallbackData = await fallbackRes.json();
      console.log("Fallback resend:", fallbackRes.status, fallbackData);
      setStep(2);
      setSuccessMsg("A verification email has been dispatched to your inbox.");
    } else {
      console.log("New user registration successful.");
      setStep(2);
    }
    setLoading(false);
  };

  // Initial Session Check & Pre-fill
  useEffect(() => {
    if (!authLoading && user) {
      // ENFORCE EMAIL CONFIRMATION: If email is not confirmed, stay/go to step 2
      if (!user.email_confirmed_at) {
        setStep(2);
        return;
      }

      if (profile) {
        // 1. ADMIN/STAFF BYPASS: Managers should NEVER see the athlete onboarding flow
        if (profile.role === 'superadmin' || profile.role === 'staff') {
          router.push('/admin');
          return;
        }

        // 2. ATHLETE COMPLETION CHECK
        const requiredFields = [
          'first_name', 'last_name', 'username', 'date_of_birth',
          'phone_number', 'address', 'country',
          'emergency_contact_name', 'emergency_contact_phone',
          'height', 'weight', 'position_played', 'training_goals'
        ];

        const isComplete = requiredFields.every((field: string) => {
          const value = (profile as any)[field];
          return value !== null && value !== undefined && value !== '';
        });

        if (isComplete) {
          router.push('/dashboard');
          return;
        }

        // Pre-fill form with existing data
        setFormData(prev => ({
          ...prev,
          firstName: profile.first_name || '',
          lastName: profile.last_name || '',
          username: profile.username || '',
          dob: profile.date_of_birth || '',
          phone: profile.phone_number ? profile.phone_number.replace(/^\+?\d+/, '') : '',
          countryCode: profile.phone_number?.match(/^\+\d+/)?.[0] || '+94',
          addressLine1: profile.address?.split(',')[0] || '',
          city: profile.address?.split(',')[1]?.trim() || '',
          state: profile.address?.split(',')[2]?.trim() || '',
          country: profile.country || 'SRILANKA',
          emergencyName: profile.emergency_contact_name || '',
          emergencyPhone: profile.emergency_contact_phone ? profile.emergency_contact_phone.replace(/^\+?\d+/, '') : '',
          emergencyCountryCode: profile.emergency_contact_phone?.match(/^\+\d+/)?.[0] || '+94',
          height: profile.height?.toString() || '',
          weight: profile.weight?.toString() || '',
          position: profile.position_played || '',
          goals: profile.training_goals || '',
          medicalHistory: profile.medical_history || ''
        }));

        // User is logged in and confirmed but profile incomplete (and is an athlete)
        if (step < 3) setStep(3);
      } else {
        // Logged in and confirmed but no profile at all
        if (step < 3) setStep(3);
      }
    }
  }, [user, profile, authLoading, router]);

  // Email verification polling (step 2)
  useEffect(() => {
    if (step === 2) {
      if (resendTimer > 0) {
        const timerId = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
        return () => clearTimeout(timerId);
      }

      if (user && user.email_confirmed_at) {
        setStep(3);
      }
    }
  }, [step, user, resendTimer]);

  const handleResendEmail = async () => {
    if (resendTimer > 0) return;

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    
    const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/api/auth/callback` : undefined;

    const res = await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: formData.email, redirectTo }),
    });

    const resData = await res.json();
    console.log("Manual Resend via Admin API:", res.status, resData);

    if (res.status === 200 && resData.status === "sent") {
      setSuccessMsg("Verification link resent successfully. Check your inbox.");
      setResendTimer(150);
    } else if (res.status === 200 && resData.status === "already_confirmed") {
      setSuccessMsg("Your email is already verified. Please sign in.");
    } else {
      setErrorMsg(resData.error || "Failed to resend verification email. Please try again.");
    }
    setLoading(false);
  };

  const handleDevVerify = async () => {
    if (!user?.id) return;
    setLoading(true);

    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, confirmEmail: true })
    });

    if (res.ok) {
      setSuccessMsg("System Overridden. Initializing Profile Setup...");
      setTimeout(() => setStep(3), 1000);
    } else {
      const err = await res.json();
      setErrorMsg(`Override Failed: ${err.error || "Manual verification failed"}`);
    }
    setLoading(false);
  };

  // Step 3-5: Profile Update Logic
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      console.log("[KIO-X SYNC v2.0] Initiating final profile sync using local session...");

      // 1. Use existing user from hook to prevent hanging on getSession()
      if (!user?.id) {
        console.error("Local user object missing. Attempting one-time session recovery...");
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          setErrorMsg("Authentication required. Please sign in again.");
          setLoading(false);
          return;
        }
      }

      const activeUserId = user?.id;
      console.log("Syncing profile for User ID:", activeUserId);

      // 2. Sanitize Numerical Inputs
      const h = parseFloat(formData.height);
      const w = parseFloat(formData.weight);

      const updates = {
        id: activeUserId,
        first_name: formData.firstName,
        last_name: formData.lastName,
        date_of_birth: formData.dob,
        address: `${formData.addressLine1}${formData.addressLine2 ? ', ' + formData.addressLine2 : ''}, ${formData.city}, ${formData.state}`,
        country: formData.country,
        phone_number: `${formData.countryCode}${formData.phone}`.replace(/\s+/g, ''),
        emergency_contact_name: formData.emergencyName,
        emergency_contact_phone: `${formData.emergencyCountryCode}${formData.emergencyPhone}`.replace(/\s+/g, ''),
        username: formData.username.toLowerCase().trim(),
        height: isNaN(h) ? null : h,
        weight: isNaN(w) ? null : w,
        position_played: formData.position,
        training_goals: formData.goals,
        medical_history: formData.medicalHistory,
        waiver_accepted: formData.waiverAccepted,
        updated_at: new Date().toISOString()
      };

      // 3. Database Upsert with Timeout Safety (Increased to 15s for stability)
      const syncPromise = supabase.from('profiles').upsert(updates);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Database Sync Timeout. This usually indicates invalid API keys in your .env.local or a network interruption.")), 15000)
      );

      const { error: upsertError } = await Promise.race([syncPromise, timeoutPromise]) as any;

      if (upsertError) {
        console.error("Database Upsert Failed:", upsertError);
        
        // Handle Duplicate Username specifically
        if (upsertError.message.toLowerCase().includes('duplicate key') && upsertError.message.toLowerCase().includes('username')) {
          setErrorMsg("THAT USERNAME IS ALREADY TAKEN. PLEASE CHOOSE ANOTHER.");
          setDirection(-1);
          setStep(3); // Jump back to Profile Data phase
          setLoading(false);
          return;
        }

        setErrorMsg(`Registry Error: ${upsertError.message || 'Verification failed at the database layer'}`);
        setLoading(false);
      } else {
        console.log("Profile sync successful. Redirecting to dashboard...");
        setSuccessMsg("Registry Synchronized. Welcome to KIO-X.");
        setLoading(false); // Stop the spinner immediately
        
        // Non-blocking refresh
        refreshProfile().catch(console.error);

        // Redirect with a hard fallback
        setTimeout(() => {
          router.push("/dashboard");
          // Hard fallback if router fails
          setTimeout(() => {
            if (window.location.pathname !== '/dashboard') {
              window.location.href = "/dashboard";
            }
          }, 2000);
        }, 1000);
      }
    } catch (err: any) {
      console.error("Critical submission error:", err);
      setErrorMsg(`System Error: ${err.message || 'Unknown protocol failure'}`);
      setLoading(false);
    }
  };

  // Animation Variants
  const slideVariants: Variants = {
    initial: (direction: number) => ({
      x: direction > 0 ? 20 : -20,
      opacity: 0
    }),
    animate: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.4, ease: "easeOut" }
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 20 : -20,
      opacity: 0,
      transition: { duration: 0.3, ease: "easeIn" }
    })
  };

  const [direction, setDirection] = useState(1);

  const nextStep = () => {
    setDirection(1);
    setStep(prev => (prev + 1) as Step);
  };

  const prevStep = () => {
    setDirection(-1);
    setStep(prev => (prev - 1) as Step);
  };

  return (
    <main className="min-h-screen bg-[#080808] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor - Match to signin */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#22c55e 1px, transparent 1px), linear-gradient(90deg, #22c55e 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#22c55e]/5 blur-[120px] rounded-full" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 w-full max-w-[500px]">
        {/* Logo - Match to signin */}
        <div className="flex flex-col items-center mb-10">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-full border border-white/20 bg-black/50 flex items-center justify-center overflow-hidden">
              <Image src="/newlogo.png" alt="KIO-X" width={40} height={40} className="object-contain" priority unoptimized={true} />
            </div>
            <span className="font-display text-3xl text-white group-hover:text-[#22c55e] transition-colors">KIO-X</span>
          </Link>
          <div className="mt-4 font-label text-[#22c55e] opacity-60">Step {step} of 5</div>
        </div>

        {/* Card - Match to signin */}
        <div className="bg-[#111111] border border-white/10 rounded-[24px] overflow-hidden shadow-2xl">
          {/* Progress Bar (Subtle) */}
          <div className="h-[2px] w-full bg-white/5">
            <motion.div
              initial={{ width: "20%" }}
              animate={{ width: `${(step / 5) * 100}%` }}
              className="h-full bg-[#22c55e] shadow-[0_0_10px_rgba(34,197,94,0.5)]"
            />
          </div>

          <div className="p-8 md:p-12">
            {errorMsg && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-500 font-label text-center flex items-center justify-center gap-2">
                <AlertCircle size={14} /> {errorMsg}
              </motion.div>
            )}

            <AnimatePresence mode="wait" custom={direction}>
              {step === 1 && (
                <motion.div key="step1" custom={direction} variants={slideVariants} initial="initial" animate="animate" exit="exit">
                  <div className="mb-8">
                    <h2 className="font-display text-2xl text-white mb-1">Create Account</h2>
                    <p className="font-label text-gray-500">Phase One: Access Credentials</p>
                  </div>
                  <form onSubmit={handleSignUp} className="space-y-6">
                    <div className="space-y-2">
                      <label className="block font-label text-[#22c55e] font-bold">Email Address</label>
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#22c55e] transition-colors" size={18} />
                        <input name="email" value={formData.email} onChange={handleChange} required type="email" placeholder="name@example.com" className="w-full bg-black/30 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-[#22c55e]/50 focus:bg-black/50 transition-all font-sans font-medium" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block font-label text-[#22c55e] font-bold">Password</label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#22c55e] transition-colors" size={18} />
                        <input name="password" value={formData.password} onChange={handleChange} required type={showPassword ? "text" : "password"} placeholder="••••••••" className="w-full bg-black/30 border border-white/10 rounded-xl py-4 pl-12 pr-12 text-white placeholder:text-gray-500 focus:outline-none focus:border-[#22c55e]/50 focus:bg-black/50 transition-all font-sans font-medium" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      {/* Strength Bar */}
                      <div className="space-y-1.5 px-1">
                        <div className="flex justify-between items-center text-[8px] font-black tracking-[1px] uppercase">
                          <span className="text-gray-400">Security Level</span>
                          <span style={{ color: passwordStrength.color }}>{passwordStrength.label}</span>
                        </div>
                        <div className="h-[3px] w-full bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${passwordStrength.score}%`, backgroundColor: passwordStrength.color }}
                            className="h-full"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="block font-label text-[#22c55e] font-bold">Confirm Password</label>
                        {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                          <span className="font-label text-[#ef4444] animate-pulse">Mismatch</span>
                        )}
                      </div>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#22c55e] transition-colors" size={18} />
                        <input name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required type={showPassword ? "text" : "password"} placeholder="••••••••" className="w-full bg-black/30 border border-white/10 rounded-xl py-4 pl-12 pr-12 text-white placeholder:text-gray-500 focus:outline-none focus:border-[#22c55e]/50 focus:bg-black/50 transition-all font-sans font-medium" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                    <button type="submit" disabled={loading} className="w-full bg-[#22c55e] text-black font-button py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-[#4ade80] hover:scale-[1.02] disabled:opacity-50 transition-all duration-300 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                      {loading ? <Loader2 className="animate-spin" /> : <>Next <ChevronRight size={18} /></>}
                    </button>
                    <p className="text-center text-[10px] font-bold text-gray-500 tracking-[2px] uppercase">
                      Already have an account? <Link href="/signin" className="text-[#22c55e] hover:underline">Sign In</Link>
                    </p>
                  </form>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="step2" custom={direction} variants={slideVariants} initial="initial" animate="animate" exit="exit" className="text-center py-6">
                  <div className="w-20 h-20 bg-[#22c55e]/10 border border-[#22c55e]/20 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(34,197,94,0.1)]">
                    <Mail className="text-[#22c55e]" size={32} />
                  </div>
                  <h2 className="font-display text-2xl text-white mb-4">Verify Email</h2>
                  {successMsg && <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-500 text-[10px] font-black uppercase tracking-[2px] text-center">{successMsg}</div>}
                  <p className="text-gray-400 font-label leading-relaxed mb-6">
                    Transmission sent to <br /><span className="text-white font-bold">{formData.email}</span>
                  </p>
                  <div className="mb-10 p-5 bg-white/5 border border-white/5 rounded-2xl text-left space-y-4">
                    <div className="flex items-center gap-2 text-[10px] font-black text-[#22c55e] uppercase tracking-widest">
                      <ShieldCheck size={14} /> Protocol Verification Guide
                    </div>
                    <div className="space-y-3">
                      <p className="text-[9px] font-bold text-white/40 uppercase tracking-[1px] leading-relaxed">
                        1. <span className="text-white">Check Spam Registry</span>: Verify your spam/junk folders. Links often end up there.
                      </p>
                      <p className="text-[9px] font-bold text-white/40 uppercase tracking-[1px] leading-relaxed">
                        2. <span className="text-white">Rate Limits</span>: Supabase restricts verification emails to 3 per hour. Wait 15 minutes before retrying.
                      </p>
                      <p className="text-[9px] font-bold text-white/40 uppercase tracking-[1px] leading-relaxed">
                        3. <span className="text-white">SMTP Alignment</span>: If using custom SMTP, ensure the <span className="text-[#22c55e]">Sender Name/Email</span> in the Supabase Dashboard matches your SMTP user.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-6">
                    <div className="flex items-center gap-3 font-label text-[#22c55e]">
                      <Loader2 className="animate-spin" size={16} />
                      Waiting for uplink...
                    </div>

                    <div className="w-full max-w-sm space-y-4 mt-6">
                      <button
                        onClick={handleResendEmail}
                        disabled={loading || resendTimer > 0}
                        className="w-full py-4 font-label border border-white/10 text-gray-500 hover:text-white hover:border-[#22c55e]/50 disabled:opacity-30 transition-all rounded-xl"
                      >
                        {resendTimer > 0 ? `Resend Link In ${Math.floor(resendTimer / 60)}:${(resendTimer % 60).toString().padStart(2, '0')}` : "Resend Verification Email"}
                      </button>

                      <button
                        onClick={prevStep}
                        className="w-full py-2 text-[8px] font-black uppercase tracking-[2px] text-gray-500 hover:text-[#22c55e] transition-colors"
                      >
                        Wrong email? Edit Address
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="step3" custom={direction} variants={slideVariants} initial="initial" animate="animate" exit="exit">
                  <div className="mb-8">
                    <h2 className="font-display text-2xl text-white mb-1">Personal Identity</h2>
                    <p className="font-label text-gray-500">Phase Three: Base Profile</p>
                  </div>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block font-label text-[#22c55e] font-bold">First Name <span className="text-red-500">*</span></label>
                        <input name="firstName" value={formData.firstName} onChange={handleChange} required type="text" placeholder="First Name" className="w-full bg-black/30 border border-white/10 rounded-xl py-4 px-6 text-white placeholder:text-gray-500 focus:outline-none focus:border-[#22c55e]/50 focus:bg-black/50 transition-all font-sans text-sm font-medium" />
                      </div>
                      <div className="space-y-2">
                        <label className="block font-label text-[#22c55e] font-bold">Last Name <span className="text-red-500">*</span></label>
                        <input name="lastName" value={formData.lastName} onChange={handleChange} required type="text" placeholder="Last Name" className="w-full bg-black/30 border border-white/10 rounded-xl py-4 px-6 text-white placeholder:text-gray-500 focus:outline-none focus:border-[#22c55e]/50 focus:bg-black/50 transition-all font-sans text-sm font-medium" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block font-label text-[#22c55e] font-bold">Username <span className="text-red-500">*</span></label>
                      <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#22c55e] transition-colors" size={18} />
                        <input name="username" value={formData.username} onChange={handleChange} required type="text" placeholder="CHOOSE_A_HANDLE" className="w-full bg-black/30 border border-white/10 rounded-xl py-4 pl-12 pr-6 text-white placeholder:text-gray-500 focus:outline-none focus:border-[#22c55e]/50 focus:bg-black/50 transition-all font-sans text-sm font-medium lowercase" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block font-label text-[#22c55e]">Date of Birth <span className="text-red-500">*</span></label>
                      <div className="relative group">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#22c55e] transition-colors pointer-events-none" size={18} />
                        <input
                          name="dob"
                          value={formData.dob}
                          onChange={handleChange}
                          required
                          type="date"
                          max={format(subYears(new Date(), 5), "yyyy-MM-dd")}
                          className="w-full bg-black/30 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-[#22c55e]/50 focus:bg-black/50 transition-all font-sans text-sm [color-scheme:dark]"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (formData.username.length < 3) {
                          setErrorMsg("USERNAME MUST BE AT LEAST 3 CHARACTERS");
                          return;
                        }
                        if (!/^[a-z0-9_]+$/.test(formData.username)) {
                          setErrorMsg("USERNAME CAN ONLY CONTAIN LETTERS, NUMBERS, AND UNDERSCORES");
                          return;
                        }
                        setErrorMsg("");
                        nextStep();
                      }}
                      disabled={!formData.firstName || !formData.lastName || !formData.dob || !formData.username}
                      className="w-full bg-[#22c55e] text-black font-button py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-[#4ade80] hover:scale-[1.02] disabled:opacity-30 disabled:hover:scale-100 transition-all shadow-[0_0_30px_rgba(34,197,94,0.2)]"
                    >
                      Continue <ChevronRight size={18} />
                    </button>
                    {errorMsg && <p className="text-red-500 text-[9px] font-black uppercase tracking-widest text-center mt-4">{errorMsg}</p>}
                  </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div key="step4" custom={direction} variants={slideVariants} initial="initial" animate="animate" exit="exit">
                  <div className="mb-8">
                    <h2 className="font-display text-2xl text-white mb-1">Connectivity</h2>
                    <p className="font-label text-gray-400">Phase Four: Contact Details</p>
                  </div>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block font-label text-[#22c55e]">Phone Number <span className="text-red-500">*</span></label>
                        <div className="flex gap-2">
                          <select
                            name="countryCode"
                            value={formData.countryCode}
                            onChange={handleChange}
                            className="w-[140px] bg-black/30 border border-white/10 rounded-xl py-4 px-4 text-white focus:outline-none focus:border-[#22c55e]/50 focus:bg-black/50 transition-all font-sans text-[11px] appearance-none cursor-pointer"
                          >
                            {countries.map(c => (
                              <option key={c.name} value={c.code} className="bg-[#111] text-white">
                                {c.code} ({c.name.substring(0, 3)})
                              </option>
                            ))}
                          </select>
                          <input
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            onInput={(e) => {
                              e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, '');
                            }}
                            maxLength={15}
                            required
                            type="tel"
                            placeholder="77 123 4567"
                            className="flex-1 bg-black/30 border border-white/10 rounded-xl py-4 px-6 text-white placeholder:text-gray-500 focus:outline-none focus:border-[#22c55e]/50 focus:bg-black/50 transition-all font-sans text-sm font-medium"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Address Line 1 */}
                      <div className="space-y-2">
                        <label className="block font-label text-[#22c55e]">Address Line 1 <span className="text-red-500">*</span></label>
                        <input name="addressLine1" value={formData.addressLine1} onChange={handleChange} required type="text" placeholder="Street address, P.O. box" className="w-full bg-black/30 border border-white/10 rounded-xl py-4 px-6 text-white placeholder:text-gray-700 focus:outline-none focus:border-[#22c55e]/50 focus:bg-black/50 transition-all font-sans text-sm" />
                      </div>

                      {/* Address Line 2 */}
                      <div className="space-y-2">
                        <label className="block font-label text-gray-500">Address Line 2 (Optional)</label>
                        <input name="addressLine2" value={formData.addressLine2} onChange={handleChange} type="text" placeholder="Apartment, suite, unit" className="w-full bg-black/30 border border-white/10 rounded-xl py-4 px-6 text-white placeholder:text-gray-700 focus:outline-none focus:border-[#22c55e]/50 focus:bg-black/50 transition-all font-sans text-sm" />
                      </div>

                      {/* City & State */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="block font-label text-[#22c55e]">City <span className="text-red-500">*</span></label>
                          <input name="city" value={formData.city} onChange={handleChange} required type="text" placeholder="City" className="w-full bg-black/30 border border-white/10 rounded-xl py-4 px-6 text-white placeholder:text-gray-700 focus:outline-none focus:border-[#22c55e]/50 focus:bg-black/50 transition-all font-sans text-sm" />
                        </div>
                        <div className="space-y-2">
                          <label className="block font-label text-[#22c55e]">State / Province <span className="text-red-500">*</span></label>
                          <input name="state" value={formData.state} onChange={handleChange} required type="text" placeholder="State / Region" className="w-full bg-black/30 border border-white/10 rounded-xl py-4 px-6 text-white placeholder:text-gray-700 focus:outline-none focus:border-[#22c55e]/50 focus:bg-black/50 transition-all font-sans text-sm" />
                        </div>
                      </div>

                      {/* Country - Now at the end */}
                      <div className="space-y-2 pt-2">
                        <label className="block font-label text-gray-500">Country (Auto-locked)</label>
                        <div className="relative">
                          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700" size={16} />
                          <input
                            name="country"
                            value={formData.country}
                            readOnly
                            className="w-full bg-white/5 border border-white/5 rounded-xl py-4 pl-12 pr-6 text-white/40 font-black tracking-[1px] font-sans text-sm uppercase cursor-not-allowed"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="pt-6 border-t border-white/5 space-y-4">
                      <h3 className="font-label text-white/40">Emergency Contact <span className="text-red-500">*</span></h3>
                      <div className="space-y-4">
                        <input name="emergencyName" value={formData.emergencyName} onChange={handleChange} required type="text" placeholder="Contact Name" className="w-full bg-black/30 border border-white/10 rounded-xl py-4 px-6 text-white placeholder:text-gray-700 focus:outline-none focus:border-[#22c55e]/50 focus:bg-black/50 transition-all font-sans text-sm" />
                        <div className="flex gap-2">
                          <select
                            name="emergencyCountryCode"
                            value={formData.emergencyCountryCode}
                            onChange={handleChange}
                            className="w-[140px] bg-black/30 border border-white/10 rounded-xl py-4 px-4 text-white focus:outline-none focus:border-[#22c55e]/50 focus:bg-black/50 transition-all font-sans text-[11px] appearance-none cursor-pointer"
                          >
                            {countries.map(c => (
                              <option key={c.name} value={c.code} className="bg-[#111] text-white">
                                {c.code} ({c.name.substring(0, 3)})
                              </option>
                            ))}
                          </select>
                          <input
                            name="emergencyPhone"
                            value={formData.emergencyPhone}
                            onChange={handleChange}
                            onInput={(e) => {
                              e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, '');
                            }}
                            maxLength={15}
                            required
                            type="tel"
                            placeholder="CONTACT PHONE"
                            className="flex-1 bg-black/30 border border-white/10 rounded-xl py-4 px-6 text-white placeholder:text-gray-700 focus:outline-none focus:border-[#22c55e]/50 focus:bg-black/50 transition-all font-sans text-sm"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <button type="button" onClick={prevStep} className="flex-1 bg-white/5 text-white/40 font-button py-4 rounded-xl flex items-center justify-center hover:bg-white/10 transition-all">
                        <ChevronLeft size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const phoneClean = formData.phone.replace(/\D/g, '');
                          const emergencyPhoneClean = formData.emergencyPhone.replace(/\D/g, '');
                          
                          if (phoneClean.length < 7 || phoneClean.length > 15) {
                            setErrorMsg("INVALID PRIMARY PHONE NUMBER");
                            return;
                          }
                          if (emergencyPhoneClean.length < 7 || emergencyPhoneClean.length > 15) {
                            setErrorMsg("INVALID EMERGENCY PHONE NUMBER");
                            return;
                          }
                          setErrorMsg("");
                          nextStep();
                        }}
                        disabled={!formData.phone || !formData.addressLine1 || !formData.city || !formData.state || !formData.emergencyName || !formData.emergencyPhone}
                        className="flex-[3] bg-[#22c55e] text-black font-button py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-[#4ade80] hover:scale-[1.02] disabled:opacity-30 disabled:hover:scale-100 transition-all shadow-[0_0_30px_rgba(34,197,94,0.2)]"
                      >
                        Continue <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 5 && (
                <motion.div key="step5" custom={direction} variants={slideVariants} initial="initial" animate="animate" exit="exit">
                  <div className="mb-8">
                    <h2 className="font-display text-2xl text-white mb-1">Performance Registry</h2>
                    <p className="font-label text-gray-500">Phase Five: Athlete Statistics</p>
                  </div>

                  {errorMsg && <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500 text-[10px] font-black uppercase tracking-[2px] text-center">{errorMsg}</div>}
                  {successMsg && <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-500 text-[10px] font-black uppercase tracking-[2px] text-center">{successMsg}</div>}

                  <form onSubmit={handleProfileUpdate} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Height Field */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="block text-[10px] font-black tracking-[2px] text-[#22c55e] uppercase">Height <span className="text-red-500">*</span></label>
                          <div className="flex bg-black/40 p-1 rounded-lg border border-white/5">
                            <button 
                              type="button"
                              onClick={() => toggleHeightUnit('cm')}
                              className={`px-3 py-1 rounded-md text-[9px] font-bold transition-all ${heightUnit === 'cm' ? 'bg-[#22c55e] text-black shadow-[0_0_15px_rgba(34,197,94,0.3)]' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                              CM
                            </button>
                            <button 
                              type="button"
                              onClick={() => toggleHeightUnit('ft')}
                              className={`px-3 py-1 rounded-md text-[9px] font-bold transition-all ${heightUnit === 'ft' ? 'bg-[#22c55e] text-black shadow-[0_0_15px_rgba(34,197,94,0.3)]' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                              FT
                            </button>
                          </div>
                        </div>

                        {heightUnit === 'cm' ? (
                          <input 
                            name="height" 
                            value={formData.height} 
                            onChange={handleChange} 
                            required 
                            type="number" 
                            min="50"
                            max="300"
                            placeholder="185" 
                            className="w-full bg-black/30 border border-white/10 rounded-xl py-4 px-6 text-white placeholder:text-gray-700 focus:outline-none focus:border-[#22c55e]/50 focus:bg-black/50 transition-all text-sm" 
                          />
                        ) : (
                          <div className="flex gap-2">
                            <div className="flex-1 relative">
                              <input 
                                value={ftValue.feet}
                                onChange={(e) => {
                                  const feet = e.target.value;
                                  setFtValue(prev => ({ ...prev, feet }));
                                  const cm = (Number(feet) * 30.48) + (Number(ftValue.inches) * 2.54);
                                  setFormData(prev => ({ ...prev, height: cm ? Math.round(cm).toString() : "" }));
                                }}
                                type="number"
                                min="1"
                                max="9"
                                placeholder="6"
                                className="w-full bg-black/30 border border-white/10 rounded-xl py-4 px-4 text-white placeholder:text-gray-700 focus:outline-none focus:border-[#22c55e]/50 focus:bg-black/50 transition-all text-sm"
                              />
                              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-gray-600 font-bold">FT</span>
                            </div>
                            <div className="flex-1 relative">
                              <input 
                                value={ftValue.inches}
                                onChange={(e) => {
                                  const inches = e.target.value;
                                  setFtValue(prev => ({ ...prev, inches }));
                                  const cm = (Number(ftValue.feet) * 30.48) + (Number(inches) * 2.54);
                                  setFormData(prev => ({ ...prev, height: cm ? Math.round(cm).toString() : "" }));
                                }}
                                type="number"
                                min="0"
                                max="11"
                                placeholder="1"
                                className="w-full bg-black/30 border border-white/10 rounded-xl py-4 px-4 text-white placeholder:text-gray-700 focus:outline-none focus:border-[#22c55e]/50 focus:bg-black/50 transition-all text-sm"
                              />
                              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-gray-600 font-bold">IN</span>
                            </div>
                          </div>
                        )}
                        {formData.height && (
                          <p className="text-[9px] text-gray-500 font-bold italic pl-1">
                            {heightUnit === 'cm' 
                              ? `${Math.floor(Number(formData.height) / 30.48)}'${Math.round((Number(formData.height) % 30.48) / 2.54)}"`
                              : `${formData.height} cm`}
                            {" equivalent"}
                          </p>
                        )}
                      </div>

                      {/* Weight Field */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="block text-[10px] font-black tracking-[2px] text-[#22c55e] uppercase">Weight <span className="text-red-500">*</span></label>
                          <div className="flex bg-black/40 p-1 rounded-lg border border-white/5">
                            <button 
                              type="button"
                              onClick={() => toggleWeightUnit('kg')}
                              className={`px-3 py-1 rounded-md text-[9px] font-bold transition-all ${weightUnit === 'kg' ? 'bg-[#22c55e] text-black shadow-[0_0_15px_rgba(34,197,94,0.3)]' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                              KG
                            </button>
                            <button 
                              type="button"
                              onClick={() => toggleWeightUnit('lbs')}
                              className={`px-3 py-1 rounded-md text-[9px] font-bold transition-all ${weightUnit === 'lbs' ? 'bg-[#22c55e] text-black shadow-[0_0_15px_rgba(34,197,94,0.3)]' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                              LBS
                            </button>
                          </div>
                        </div>

                        {weightUnit === 'kg' ? (
                          <input 
                            name="weight" 
                            value={formData.weight} 
                            onChange={handleChange} 
                            required 
                            type="number" 
                            min="20"
                            max="500"
                            placeholder="82" 
                            className="w-full bg-black/30 border border-white/10 rounded-xl py-4 px-6 text-white placeholder:text-gray-700 focus:outline-none focus:border-[#22c55e]/50 focus:bg-black/50 transition-all text-sm" 
                          />
                        ) : (
                          <div className="relative">
                            <input 
                              value={lbsValue}
                              onChange={(e) => {
                                const lbs = e.target.value;
                                setLbsValue(lbs);
                                const kg = Number(lbs) * 0.453592;
                                setFormData(prev => ({ ...prev, weight: kg ? kg.toFixed(1) : "" }));
                              }}
                              type="number"
                              min="44"
                              max="1100"
                              placeholder="180"
                              className="w-full bg-black/30 border border-white/10 rounded-xl py-4 px-6 text-white placeholder:text-gray-700 focus:outline-none focus:border-[#22c55e]/50 focus:bg-black/50 transition-all text-sm"
                            />
                            <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] text-gray-600 font-bold">LBS</span>
                          </div>
                        )}
                        {formData.weight && (
                          <p className="text-[9px] text-gray-500 font-bold italic pl-1">
                            {weightUnit === 'kg' 
                              ? `${Math.round(Number(formData.weight) * 2.20462)} lbs`
                              : `${formData.weight} kg`}
                            {" equivalent"}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block font-label text-[#22c55e] font-bold uppercase tracking-widest text-[10px]">Position Played <span className="text-red-500">*</span></label>
                      <input 
                        name="position" 
                        value={formData.position} 
                        onChange={(e) => {
                          const sanitized = sanitizeInput(e.target.value);
                          setFormData(prev => ({ ...prev, position: sanitized }));
                          if (fieldErrors.position) validatePhase5Field('position', sanitized);
                        }} 
                        onBlur={(e) => validatePhase5Field('position', e.target.value)}
                        required 
                        type="text" 
                        placeholder="eg: Forward" 
                        className={`w-full bg-black/30 border ${fieldErrors.position ? 'border-red-500/50 focus:border-red-500' : formData.position && !fieldErrors.position ? 'border-green-500/30 focus:border-green-500' : 'border-white/10 focus:border-[#22c55e]/50'} rounded-xl py-4 px-6 text-white placeholder:text-gray-500 focus:bg-black/50 transition-all text-sm font-medium`} 
                      />
                      {fieldErrors.position && <p className="text-red-500 text-[9px] font-bold uppercase tracking-wider pl-1">{fieldErrors.position}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="block font-label text-[#22c55e] font-bold uppercase tracking-widest text-[10px]">Main Goals <span className="text-red-500">*</span></label>
                      <textarea 
                        name="goals" 
                        value={formData.goals} 
                        onChange={(e) => {
                          const sanitized = sanitizeInput(e.target.value);
                          setFormData(prev => ({ ...prev, goals: sanitized }));
                          if (fieldErrors.goals) validatePhase5Field('goals', sanitized);
                        }} 
                        onBlur={(e) => validatePhase5Field('goals', e.target.value)}
                        required 
                        rows={2} 
                        placeholder="eg: Speed, Agility, Strength" 
                        className={`w-full bg-black/30 border ${fieldErrors.goals ? 'border-red-500/50 focus:border-red-500' : formData.goals && !fieldErrors.goals ? 'border-green-500/30 focus:border-green-500' : 'border-white/10 focus:border-[#22c55e]/50'} rounded-xl py-4 px-6 text-white placeholder:text-gray-500 focus:bg-black/50 transition-all text-sm font-medium resize-none`} 
                      />
                      {fieldErrors.goals && <p className="text-red-500 text-[9px] font-bold uppercase tracking-wider pl-1">{fieldErrors.goals}</p>}
                      <p className="text-[8px] text-gray-500 uppercase tracking-widest pl-1 font-bold">Max 10 goals, comma-separated</p>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[10px] font-black tracking-[2px] text-gray-500 uppercase">Medical History (Optional)</label>
                      <textarea 
                        name="medicalHistory" 
                        value={formData.medicalHistory} 
                        onChange={(e) => {
                          const sanitized = sanitizeInput(e.target.value);
                          setFormData(prev => ({ ...prev, medicalHistory: sanitized }));
                          if (fieldErrors.medicalHistory) validatePhase5Field('medicalHistory', sanitized);
                        }} 
                        onBlur={(e) => validatePhase5Field('medicalHistory', e.target.value)}
                        rows={2} 
                        placeholder="Any previous injuries or conditions..." 
                        className={`w-full bg-black/30 border ${fieldErrors.medicalHistory ? 'border-red-500/50 focus:border-red-500' : formData.medicalHistory && !fieldErrors.medicalHistory ? 'border-green-500/30 focus:border-green-500' : 'border-white/10 focus:border-[#22c55e]/50'} rounded-xl py-4 px-6 text-white placeholder:text-gray-700 focus:bg-black/50 transition-all text-sm resize-none`} 
                      />
                      {fieldErrors.medicalHistory && <p className="text-red-500 text-[9px] font-bold uppercase tracking-wider pl-1">{fieldErrors.medicalHistory}</p>}
                    </div>

                    <div className="p-5 bg-white/5 border border-white/10 rounded-2xl">
                      <div className="flex items-start gap-4">
                        <div className="relative pt-1 shrink-0 flex items-center justify-center w-4 h-4 mt-0.5">
                          <input type="checkbox" name="waiverAccepted" checked={formData.waiverAccepted} onChange={handleChange} className="w-4 h-4 appearance-none border border-white/20 rounded checked:bg-[#22c55e] checked:border-[#22c55e] transition-all cursor-pointer" />
                          {formData.waiverAccepted && <Check className="absolute text-black pointer-events-none" size={12} strokeWidth={4} />}
                        </div>
                        <p className="text-[8px] text-gray-400 leading-relaxed font-bold uppercase tracking-widest">
                          I voluntarily participate and assume full responsibility for any injury or damages and hereby release, indemnify, and hold harmless the KIO-X Performance Center.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <button type="button" onClick={prevStep} className="flex-1 bg-white/5 text-white/40 font-black uppercase tracking-[2px] py-4 rounded-xl flex items-center justify-center hover:bg-white/10 transition-all">
                        <ChevronLeft size={18} />
                      </button>
                      <button
                        type="submit"
                        disabled={loading || (!successMsg && (!formData.waiverAccepted || !formData.height || !formData.weight || !formData.position || !formData.goals))}
                        className={`flex-[3] ${successMsg ? 'bg-white text-black underline underline-offset-4' : 'bg-[#22c55e] text-black'} font-black uppercase tracking-[2px] py-4 rounded-xl flex items-center justify-center gap-2 hover:scale-[1.02] shadow-[0_0_30px_rgba(34,197,94,0.2)] disabled:opacity-30 disabled:hover:scale-100 transition-all`}
                      >
                        {loading ? (
                          <Loader2 className="animate-spin" />
                        ) : successMsg ? (
                          <>ACCESS DASHBOARD <ChevronRight size={18} /></>
                        ) : (
                          <>Complete Registry <ShieldCheck size={18} /></>
                        )}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer Info */}
        <div className="p-6 text-center border-t border-white/5">
          <p className="text-[8px] font-black uppercase tracking-[4px] text-gray-700">KIO-X Performance Protocol &copy; 2024</p>
        </div>
      </motion.div>
    </main>
  );
}
