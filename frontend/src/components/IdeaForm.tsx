import { useState, type KeyboardEvent } from 'react';
import {
  Box, Button, ButtonGroup, FormControl, FormHelperText, FormLabel, HStack,
  Icon, Stack, Text, Textarea, Wrap, WrapItem,
} from '@chakra-ui/react';
import { Hammer, Sparkles } from 'lucide-react';
import type { Budget, Level, PlanRequest } from '../types';

const MIN = 15;
const MAX = 2000;

const EXAMPLES = [
  'An app for a barbershop to manage appointments and send WhatsApp reminders',
  'A Discord bot that summarizes what happened in the server every week',
  'A platform where students upload notes and others search them with AI',
  'A dashboard showing a farm\'s energy consumption in real time',
];

const LEVELS: { value: Level; label: string }[] = [
  { value: 'beginner', label: 'I\'m learning' },
  { value: 'intermediate', label: 'I have experience' },
  { value: 'advanced', label: 'I\'m an expert' },
];

const BUDGETS: { value: Budget; label: string }[] = [
  { value: 'free', label: 'Free tier' },
  { value: 'low', label: 'A few dollars' },
  { value: 'flexible', label: 'Flexible' },
];

interface SegmentedProps<T extends string> {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}

function Segmented<T extends string>({ label, options, value, onChange }: SegmentedProps<T>) {
  return (
    <Box role="group" aria-label={label}>
      <Text fontWeight={600} fontSize="sm" mb={2}>{label}</Text>
      <ButtonGroup isAttached size="sm" flexWrap="wrap" rowGap={2}>
        {options.map((o) => (
          <Button
            key={o.value}
            onClick={() => onChange(o.value)}
            aria-pressed={value === o.value}
            bg={value === o.value ? 'ink' : 'white'}
            color={value === o.value ? 'white' : 'ink'}
            borderWidth="1px"
            borderColor={value === o.value ? 'ink' : 'rule'}
            _hover={{ bg: value === o.value ? 'ink' : 'sky.50' }}
            fontWeight={500}
          >
            {o.label}
          </Button>
        ))}
      </ButtonGroup>
    </Box>
  );
}

interface Props {
  onSubmit: (req: PlanRequest) => void;
  initial?: PlanRequest;
  compact?: boolean;
}

export function IdeaForm({ onSubmit, initial, compact }: Props) {
  const [idea, setIdea] = useState(initial?.idea ?? '');
  const [level, setLevel] = useState<Level>(initial?.level ?? 'beginner');
  const [budget, setBudget] = useState<Budget>(initial?.budget ?? 'low');

  const length = idea.trim().length;
  const tooShort = length < MIN;
  const tooLong = length > MAX;

  const submit = () => {
    if (!tooShort && !tooLong) onSubmit({ idea: idea.trim(), level, budget });
  };
  const onKey = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') submit();
  };

  const helper = tooLong
    ? `${length - MAX} characters over the limit. Trim it to the essentials.`
    : length === 0
      ? 'One or two sentences are enough: what does it do and who would use it?'
      : tooShort
        ? `Tell me a bit more (${MIN - length} more characters).`
        : `${length} / ${MAX} · Ctrl + Enter to send`;

  return (
    <Stack spacing={6} bg="white" borderWidth="1px" borderColor="rule" rounded="2xl" p={{ base: 5, md: 7 }} boxShadow="0 1px 0 rgba(14,34,56,0.04)">
      <FormControl isInvalid={tooLong}>
        <FormLabel htmlFor="idea" fontFamily="heading" fontSize="xl" fontWeight={700}>
          {compact ? 'Try another idea' : 'What do you want to build?'}
        </FormLabel>
        <Textarea
          id="idea"
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          onKeyDown={onKey}
          placeholder="E.g.: An app for my neighborhood to share borrowed tools…"
          rows={compact ? 3 : 5}
          resize="vertical"
          bg="paper"
          borderColor="rule"
          focusBorderColor="sky.500"
        />
        <FormHelperText color={tooLong ? 'red.600' : 'muted'}>{helper}</FormHelperText>
      </FormControl>

      {!compact && (
        <Box>
          <Text fontSize="sm" color="muted" mb={2}>No idea yet? Tap one:</Text>
          <Wrap spacing={2}>
            {EXAMPLES.map((ex) => (
              <WrapItem key={ex}>
                <Button
                  size="sm"
                  variant="outline"
                  borderColor="rule"
                  fontWeight={400}
                  textAlign="left"
                  whiteSpace="normal"
                  h="auto"
                  py={2}
                  onClick={() => setIdea(ex)}
                  leftIcon={<Icon as={Sparkles} boxSize={3.5} color="sky.500" />}
                >
                  {ex}
                </Button>
              </WrapItem>
            ))}
          </Wrap>
        </Box>
      )}

      <HStack spacing={8} align="flex-start" flexWrap="wrap" rowGap={5}>
        <Segmented label="Your level" options={LEVELS} value={level} onChange={setLevel} />
        <Segmented label="Your budget" options={BUDGETS} value={budget} onChange={setBudget} />
      </HStack>

      <Button
        size="lg"
        alignSelf="flex-start"
        bg="sky.500"
        color="white"
        _hover={{ bg: 'sky.600' }}
        _disabled={{ bg: 'sky.200', cursor: 'not-allowed' }}
        isDisabled={tooShort || tooLong}
        onClick={submit}
        leftIcon={<Icon as={Hammer} boxSize={5} />}
      >
        Draw my blueprint
      </Button>
    </Stack>
  );
}
