import { useEffect, useState } from 'react';
import { Box, Button, Text, VStack, Icon } from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import { LoaderCircle } from 'lucide-react';

const MESSAGES = [
  'Nimbo is reading your idea…',
  'Picking AWS services that won\'t blow your budget…',
  'Making sure the architecture isn\'t over-engineered…',
  'Working out what it would really cost…',
  'Lining up the roadmap, step by step…',
];

const spin = keyframes`to { transform: rotate(360deg); }`;
const sweep = keyframes`0% { transform: translateX(-100%); } 100% { transform: translateX(100%); }`;
const reduce = { '@media (prefers-reduced-motion: reduce)': { animation: 'none' } };

export function Thinking({ onCancel }: { onCancel: () => void }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((n) => (n + 1) % MESSAGES.length), 3200);
    return () => clearInterval(id);
  }, []);

  return (
    <VStack
      spacing={5}
      bg="blueprint"
      color="white"
      rounded="2xl"
      py={14}
      px={6}
      role="status"
      aria-live="polite"
      backgroundImage="linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.07) 1px, transparent 1px)"
      backgroundSize="24px 24px"
    >
      <Icon as={LoaderCircle} boxSize={9} color="marker" animation={`${spin} 1.6s linear infinite`} sx={reduce} />
      <Text fontFamily="heading" fontSize="xl" fontWeight={500} textAlign="center" minH="2em">
        {MESSAGES[i]}
      </Text>
      <Box w="full" maxW="280px" h="4px" bg="whiteAlpha.300" rounded="full" overflow="hidden">
        <Box h="full" w="50%" bg="marker" rounded="full" animation={`${sweep} 1.4s ease-in-out infinite`} sx={reduce} />
      </Box>
      <Text fontSize="sm" color="whiteAlpha.800">Usually takes 10 to 20 seconds.</Text>
      <Button size="sm" variant="outline" color="white" borderColor="whiteAlpha.500" _hover={{ bg: 'whiteAlpha.200' }} onClick={onCancel}>
        Cancel
      </Button>
    </VStack>
  );
}
