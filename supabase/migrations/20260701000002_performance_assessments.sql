-- ==========================================
-- KIO-X PERFORMANCE ASSESSMENTS INFRASTRUCTURE
-- Author: Antigravity / Elite Performance 
-- ==========================================

-- 1. Create Performance Assessments Table
CREATE TABLE IF NOT EXISTS public.performance_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assessment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  assessment_type TEXT NOT NULL CHECK (assessment_type IN ('FUNCTIONAL_CHECKUP', 'VALD_FORCE', 'MATCH_PERFORMANCE', 'FULL_ASSESSMENT')),
  season TEXT,
  height_cm DECIMAL,
  weight_kg DECIMAL,
  bmi DECIMAL GENERATED ALWAYS AS 
    (CASE WHEN height_cm > 0 THEN (weight_kg / POWER(height_cm/100, 2)) ELSE 0 END) STORED,
  position TEXT CHECK (position IN ('GOALKEEPER', 'DEFENDER', 'MIDFIELDER', 'FORWARD')),
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SUBMITTED')),
  
  -- Overall Scores
  performance_score INTEGER CHECK (performance_score BETWEEN 0 AND 100),
  mobility_score INTEGER CHECK (mobility_score BETWEEN 0 AND 100),
  symmetry_score INTEGER CHECK (symmetry_score BETWEEN 0 AND 100),
  risk_score INTEGER CHECK (risk_score BETWEEN 0 AND 100),
  
  -- VALD Force Profile
  hamstrings_left DECIMAL,
  hamstrings_right DECIMAL,
  hamstrings_asymmetry DECIMAL,
  hamstrings_status TEXT CHECK (hamstrings_status IN ('OK', 'MONITOR', 'FOCUS')),
  
  adductors_left DECIMAL,
  adductors_right DECIMAL,
  adductors_asymmetry DECIMAL,
  adductors_status TEXT CHECK (adductors_status IN ('OK', 'MONITOR', 'FOCUS')),
  
  hip_extension_left DECIMAL,
  hip_extension_right DECIMAL,
  hip_extension_asymmetry DECIMAL,
  hip_extension_status TEXT CHECK (hip_extension_status IN ('OK', 'MONITOR', 'FOCUS')),
  
  hip_abduction_left DECIMAL,
  hip_abduction_right DECIMAL,
  hip_abduction_asymmetry DECIMAL,
  hip_abduction_status TEXT CHECK (hip_abduction_status IN ('OK', 'MONITOR', 'FOCUS')),
  
  hip_flexion_left DECIMAL,
  hip_flexion_right DECIMAL,
  hip_flexion_asymmetry DECIMAL,
  hip_flexion_status TEXT CHECK (hip_flexion_status IN ('OK', 'MONITOR', 'FOCUS')),
  
  -- Functional Movement Tests (Percentages)
  cspine_rotation INTEGER CHECK (cspine_rotation BETWEEN 0 AND 100),
  forward_bend INTEGER CHECK (forward_bend BETWEEN 0 AND 100),
  hip_ir_left INTEGER CHECK (hip_ir_left BETWEEN 0 AND 100),
  hip_er_both INTEGER CHECK (hip_er_both BETWEEN 0 AND 100),
  deep_squat INTEGER CHECK (deep_squat BETWEEN 0 AND 100),
  ankle_df INTEGER CHECK (ankle_df BETWEEN 0 AND 100),
  great_toe_ext INTEGER CHECK (great_toe_ext BETWEEN 0 AND 100),
  single_leg_stand INTEGER CHECK (single_leg_stand BETWEEN 0 AND 100),
  
  -- Body Map
  body_map_zones JSONB DEFAULT '[]',
  
  -- Performance Impact (Percentages)
  acceleration_impact INTEGER CHECK (acceleration_impact BETWEEN 0 AND 100),
  sprint_impact INTEGER CHECK (sprint_impact BETWEEN 0 AND 100),
  change_of_direction_impact INTEGER CHECK (change_of_direction_impact BETWEEN 0 AND 100),
  kicking_impact INTEGER CHECK (kicking_impact BETWEEN 0 AND 100),
  landing_impact INTEGER CHECK (landing_impact BETWEEN 0 AND 100),
  single_leg_stability INTEGER CHECK (single_leg_stability BETWEEN 0 AND 100),
  
  -- Key Findings & Summary
  key_findings JSONB DEFAULT '[]',
  risk_factors JSONB DEFAULT '[]',
  coach_summary TEXT,
  
  -- Progress
  previous_assessment_id UUID REFERENCES public.performance_assessments(id) ON DELETE SET NULL,
  improvement_notes TEXT,
  retest_recommended_date DATE,
  
  -- Meta
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Indexing for High-Velocity Queries
CREATE INDEX IF NOT EXISTS idx_assessment_athlete_date ON public.performance_assessments(athlete_id, assessment_date);
CREATE INDEX IF NOT EXISTS idx_assessment_status ON public.performance_assessments(status);

-- 3. RLS Security Configuration
ALTER TABLE public.performance_assessments ENABLE ROW LEVEL SECURITY;

-- SELECT POLICY:
-- Staff, Admin, Coach, Medical can read all assessments.
-- Players (Athletes) can only select their own assessments.
CREATE POLICY "performance_assessments_select"
  ON public.performance_assessments
  FOR SELECT
  TO authenticated
  USING (
    (athlete_id = auth.uid())
    OR
    (EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
        AND role IN ('superadmin', 'staff', 'coach', 'medical')
    ))
  );

-- INSERT POLICY:
-- Staff, Admin, Coach, Medical can insert.
CREATE POLICY "performance_assessments_insert"
  ON public.performance_assessments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
        AND role IN ('superadmin', 'staff', 'coach', 'medical')
    )
  );

-- UPDATE POLICY:
-- Admin and Staff can update any assessment.
-- Coach and Medical can only update their own created assessments.
CREATE POLICY "performance_assessments_update"
  ON public.performance_assessments
  FOR UPDATE
  TO authenticated
  USING (
    (EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
        AND role IN ('superadmin', 'staff')
    ))
    OR
    (created_by = auth.uid() AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
        AND role IN ('coach', 'medical')
    ))
  )
  WITH CHECK (
    (EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
        AND role IN ('superadmin', 'staff')
    ))
    OR
    (created_by = auth.uid() AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
        AND role IN ('coach', 'medical')
    ))
  );

-- DELETE POLICY:
-- Only Admin and Staff can delete assessments.
CREATE POLICY "performance_assessments_delete"
  ON public.performance_assessments
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
        AND role IN ('superadmin', 'staff')
    )
  );
