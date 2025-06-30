import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCog, FaEdit } from 'react-icons/fa';

const Container = styled.div`
  min-height: 100vh;
  background: #f7fafc;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 0;
`;
const Title = styled.h1`
  font-size: 2.2rem;
  margin-bottom: 16px;
`;
const Section = styled.section`
  background: #fff;
  border-radius: 24px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.10);
  padding: 48px 56px;
  margin-bottom: 48px;
  width: 700px;
  max-width: 95vw;
`;
const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
`;
const Input = styled.input`
  width: 100%;
  padding: 8px 12px;
  margin-bottom: 16px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 1rem;
`;
const DescInput = styled.textarea`
  width: 100%;
  padding: 8px 12px;
  margin-bottom: 16px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 1rem;
  resize: vertical;
`;
const NumberRow = styled.div`
  display: flex;
  align-items: center;
  font-size: 3.2rem;
  font-weight: bold;
  margin-bottom: 8px;
  justify-content: flex-start;
`;
const FlipDigit = styled(motion.span)`
  display: inline-block;
  min-width: 1.2em;
  text-align: center;
  background: #222;
  color: #fff;
  border-radius: 6px;
  margin: 0 2px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
`;
const Desc = styled.div`
  color: #666;
  margin-bottom: 4px;
  margin-top: 0;
`;
const ToggleButton = styled.button`
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-size: 1rem;
  cursor: pointer;
  margin-top: 32px;
  transition: background 0.2s;
  min-width: 120px;
  text-align: center;
  
  &:hover {
    background: #2563eb;
  }
`;
const ConfigSection = styled(motion.div)`
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  padding: 24px 32px;
  margin-bottom: 24px;
  min-width: 340px;
  overflow: hidden;
  margin-top: 24px;
`;

const GearButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #888;
  font-size: 1.4rem;
  padding: 4px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  &:hover:enabled {
    background: #f0f0f0;
    color: #2563eb;
  }
  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

const SectionWithIcon = styled(Section)`
  position: relative;
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0,0,0,0.2);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ModalSection = styled(ConfigSection)`
  margin: auto;
  z-index: 1001;
  min-width: 340px;
  max-width: 90vw;
`;

// 设定起始时间常量（用于累计工资和存款）
const START_DATE = new Date('2024-07-07T00:00:00+08:00');

// 默认年化利率和通胀率
const INTEREST_RATE = 0.04; // 4%
const INFLATION_RATE = 0.02229; // 2.229%

/**
 * 计算在复利和通胀影响下，存款可支撑多少年
 * @param principal 初始存款
 * @param annualIncome 年收入
 * @param annualCost 年开销
 * @param interestRate 年化利率（小数）
 * @param inflationRate 通胀率（小数）
 * @param startYear 起始年份
 * @returns 可支撑年数（可为小数）
 */
function calculateYearsWithInterestAndInflation({
  principal,
  annualIncome,
  annualCost,
  interestRate = INTEREST_RATE,
  inflationRate = INFLATION_RATE,
  startYear = 2024,
}: {
  principal: number;
  annualIncome: number;
  annualCost: number;
  interestRate?: number;
  inflationRate?: number;
  startYear?: number;
}) {
  let years = 0;
  let money = principal;
  let cost = annualCost;
  let year = startYear;
  while (money > 0 && years < 200) {
    // 2035年及以后年收入恒定为5万
    const income = year >= 2035 ? 50000 : annualIncome;
    money += income; // 年收入先加进来
    money *= (1 + interestRate); // 存款复利增长
    money -= cost; // 扣除当年开销
    if (money < 0) {
      // 最后一年按比例扣除
      years += money / (-cost);
      break;
    }
    cost *= (1 + inflationRate); // 开销递增
    years += 1;
    year += 1;
  }
  return years;
}

/**
 * 金额格式化，保留两位小数，千分位分隔
 */
function formatMoney(num: number) {
  const parts = num.toFixed(2).split('.');
  parts[0] = Number(parts[0]).toLocaleString('zh-CN');
  return parts.join('.')
}

function splitDigits(num: number) {
  return formatMoney(num).split("");
}

// 新增缩写格式化函数
function formatAbbrMoney(num: number) {
  const absNum = Math.floor(Math.abs(num));
  const sign = num < 0 ? '-' : '';
  const decimal = num % 1;
  let main = '';
  let rest = '';
  if (absNum < 1000) {
    main = absNum.toString();
  } else if (absNum < 1_000_000) {
    main = Math.floor(absNum / 1000) + 'k';
    rest = (absNum % 1000).toString().padStart(3, '0');
  } else {
    main = Math.floor(absNum / 1_000_000) + 'M';
    const k = Math.floor((absNum % 1_000_000) / 1000);
    rest = k.toString() + 'k' + (absNum % 1000).toString().padStart(3, '0');
  }
  // 小数部分
  let decimalStr = decimal.toFixed(3).slice(1); // .xxx
  return sign + main + (rest ? ' ' + rest : '') + decimalStr;
}

const defaultDesc = '普通生活方式';

type LifeStyle = {
  desc: string;
  yearCost: number;
  interestRate?: number;
  inflationRate?: number;
};

const STORAGE_KEY = 'carrot-config';

const getInitialConfig = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}
  return {};
};
const initial: {
  deposit?: number;
  annualIncome?: number;
  lifeStyles?: LifeStyle[];
} = getInitialConfig();

const App: React.FC = () => {
  // 配置项
  const [deposit, setDeposit] = useState(initial.deposit ?? 100000);
  const [annualIncome, setAnnualIncome] = useState(initial.annualIncome ?? 120000);
  // 生活方式相关state已由lifeStyles数组管理，无需lifeDesc和yearCost

  // 生活方式数组
  const [lifeStyle, setLifeStyle] = useState<LifeStyle>(initial.lifeStyles?.[0] ?? { desc: defaultDesc, yearCost: 60000, interestRate: 4, inflationRate: 2.229 });
  // 编辑生活方式弹窗
  const [editLifeIndex, setEditLifeIndex] = useState<number | null>(null);
  // 编辑表单内容
  const [editDesc, setEditDesc] = useState('');
  const [editYearCost, setEditYearCost] = useState(0);
  const [editInterestRate, setEditInterestRate] = useState(lifeStyle.interestRate ?? 4);
  const [editInflationRate, setEditInflationRate] = useState(lifeStyle.inflationRate ?? 2.229);

  // 动画相关
  const [displayDeposit, setDisplayDeposit] = useState(deposit);
  const lastUpdate = useRef(Date.now());
  const prevDigits = useRef<string[]>([]);

  // 折叠状态
  const [isBaseOpen, setIsBaseOpen] = useState(false);

  // 计算从起始时间到现在的秒数
  const now = new Date();
  const elapsedSeconds = Math.max(0, (now.getTime() - START_DATE.getTime()) / 1000);

  // 工资每秒
  const salaryPerSecond = annualIncome / 365 / 24 / 60 / 60;

  // 当前存款 = 初始存款 + 工资累计
  const currentDeposit = deposit + salaryPerSecond * elapsedSeconds;

  // 在App组件内添加本地表单state
  const [baseDeposit, setBaseDeposit] = useState(deposit);
  const [baseAnnualIncome, setBaseAnnualIncome] = useState(annualIncome);

  // 打开表单时同步主state到本地state
  useEffect(() => {
    if (isBaseOpen) {
      setBaseDeposit(deposit);
      setBaseAnnualIncome(annualIncome);
    }
  }, [isBaseOpen, deposit, annualIncome]);

  // 保存函数
  const saveBaseParams = () => {
    setDeposit(baseDeposit);
    setAnnualIncome(baseAnnualIncome);
    setIsBaseOpen(false);
  };

  // 动画每秒刷新
  useEffect(() => {
    setDisplayDeposit(currentDeposit);
    lastUpdate.current = Date.now();
    const timer = setInterval(() => {
      const now = Date.now();
      const elapsed = (now - lastUpdate.current) / 1000;
      lastUpdate.current = now;
      setDisplayDeposit(prev => prev + salaryPerSecond * elapsed);
    }, 1000);
    return () => clearInterval(timer);
  }, [currentDeposit, salaryPerSecond]);

  // 数字翻转动画
  const renderFlipNumber = (num: number, abbr = false) => {
    const str = abbr ? formatAbbrMoney(num) : formatMoney(num);
    const digits = str.split("");
    const prev = prevDigits.current as string[];
    return (
      <NumberRow>
        {digits.map((d, i) => {
          const shouldAnimate = prev[i] !== d;
          return (
            <FlipDigit
              key={`${d}-${i}-${num}`}
              initial={shouldAnimate ? { rotateX: 90, opacity: 0 } : { rotateX: 0, opacity: 1 }}
              animate={{ rotateX: 0, opacity: 1 }}
              exit={shouldAnimate ? { rotateX: -90, opacity: 0 } : { rotateX: 0, opacity: 1 }}
              transition={{ duration: shouldAnimate ? 0.3 : 0 }}
            >
              {d}
            </FlipDigit>
          );
        })}
      </NumberRow>
    );
  };

  // 更新前一个数字记录
  useEffect(() => {
    prevDigits.current = splitDigits(displayDeposit);
  }, [displayDeposit]);

  // 生活方式编辑弹窗逻辑
  const openEditLife = (idx: number) => {
    setEditLifeIndex(idx);
    setEditDesc(lifeStyle.desc);
    setEditYearCost(lifeStyle.yearCost);
    setEditInterestRate(lifeStyle.interestRate ?? 4);
    setEditInflationRate(lifeStyle.inflationRate ?? 2.229);
  };
  const closeEditLife = () => setEditLifeIndex(null);
  const saveEditLife = () => {
    setLifeStyle(lifeStyle => ({
      ...lifeStyle,
      desc: editDesc,
      yearCost: editYearCost,
      interestRate: editInterestRate,
      inflationRate: editInflationRate,
    }));
    closeEditLife();
  };

  // 配置变动时保存到localStorage
  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ deposit, annualIncome, lifeStyles: [lifeStyle] })
    );
  }, [deposit, annualIncome, lifeStyle]);

  // 计算可支撑年数（考虑复利、通胀、2035年后收入变化）
  const supportYears = lifeStyle.yearCost > 0
    ? calculateYearsWithInterestAndInflation({
        principal: currentDeposit,
        annualIncome: annualIncome,
        annualCost: lifeStyle.yearCost,
        interestRate: (lifeStyle.interestRate ?? 4) / 100,
        inflationRate: (lifeStyle.inflationRate ?? 2.229) / 100,
        startYear: START_DATE.getFullYear(),
      })
    : 0;

  return (
    <Container>
      <Title>FIRE计算器</Title>
      <SectionWithIcon style={{ position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            right: 18,
            top: 18,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            width: 48,
            zIndex: 2,
          }}
        >
          <GearButton
            aria-label="基本参数"
            onClick={() => {
              setIsBaseOpen(v => !v);
            }}
          >
            <FaCog />
          </GearButton>
        </div>
        <Label>实时存款</Label>
        <Desc style={{ marginTop: 8, marginBottom: 8 }}>工资每秒增加：￥{salaryPerSecond.toFixed(4)}</Desc>
        {renderFlipNumber(displayDeposit)}
      </SectionWithIcon>
      <Section style={{ position: 'relative', border: '2px solid #3b82f6' }}>
        <div
          style={{ position: 'absolute', right: 18, top: 18, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', width: 48, zIndex: 2 }}
        >
          <GearButton aria-label="编辑生活方式" onClick={() => openEditLife(0)}>
            <FaEdit />
          </GearButton>
        </div>
        <Label>以{lifeStyle.interestRate ?? 4}%利率可生活年数</Label>
        <Desc>年开销：￥{lifeStyle.yearCost}</Desc>
        {renderFlipNumber(Number(supportYears.toFixed(2)))}
      </Section>
      <AnimatePresence>
        {editLifeIndex !== null && (
          <ModalOverlay>
            <ModalSection
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <Label>生活方式描述</Label>
              <DescInput rows={2} value={editDesc} onChange={e => setEditDesc(e.target.value)} />
              <Label>每年开销（元）</Label>
              <Input type="text" value={editYearCost === 0 ? '' : editYearCost} onChange={e => {
                const val = e.target.value.replace(/[^\d.]/g, '');
                setEditYearCost(val === '' ? 0 : Number(val));
              }} />
              <Label>年化利率（%）</Label>
              <Input type="number" value={editInterestRate} onChange={e => setEditInterestRate(Number(e.target.value.replace(/[^\d.]/g, "")))} min={0} max={100} step={0.01} />
              <Label>通货膨胀率（%）</Label>
              <Input type="number" value={editInflationRate} onChange={e => setEditInflationRate(Number(e.target.value.replace(/[^\d.]/g, "")))} min={0} max={100} step={0.01} />
              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                <ToggleButton onClick={saveEditLife}>保存</ToggleButton>
                <ToggleButton onClick={closeEditLife} style={{ background: '#aaa' }}>取消</ToggleButton>
              </div>
            </ModalSection>
          </ModalOverlay>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isBaseOpen && (
          <ModalOverlay>
            <ModalSection
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <Label>当前存款（元）</Label>
              <Input type="number" value={baseDeposit} onChange={e => setBaseDeposit(Number(e.target.value.replace(/[^\d.]/g, "")))} min={0} />
              <Label>年收入（元）</Label>
              <Input type="number" value={baseAnnualIncome} onChange={e => setBaseAnnualIncome(Number(e.target.value.replace(/[^\d.]/g, "")))} min={0} />
              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                <ToggleButton onClick={saveBaseParams}>保存</ToggleButton>
                <ToggleButton onClick={() => setIsBaseOpen(false)} style={{ background: '#aaa' }}>关闭</ToggleButton>
              </div>
            </ModalSection>
          </ModalOverlay>
        )}
      </AnimatePresence>
    </Container>
  );
};

export default App;
